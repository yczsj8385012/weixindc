import { useState } from 'react';
import { CLOUDFLARE_D1_SCHEMA, WORKER_IMPLEMENTATION_CODE } from '../data/solutionsData';
import { Code2, Copy, Check, Terminal, Database, FileCode } from 'lucide-react';

const CLIENT_CODE_SNIPPET = `// 客户端 (Node.js / Electron main.ts 官方验签标准实现)
// 包含: RSA-2048 SPKI 验签、Nonce防重放、safeStorage本地加密、72小时离线容灾

import crypto from 'node:crypto';
import os from 'node:os';
import { safeStorage } from 'electron'; // Electron 安全加密 API

// 1. 官方标准 X.509 SPKI RSA-2048 公钥
const OFFICIAL_PUBLIC_KEY = \`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqrmyM7iaxzGtytb7ZT2U
W5f7qNMlCiD5+eLagnR+iUcL0v93YwZ5NV56xAgOcZEiTPtcFMS2XiQErZnK/kM1
mH1Qydg2OMSQpcueYatdDfp9/dkwyclEIB3RZP/R1B8796SA0cP6qsYa18niC6tF
0ciTM/VEbL4OmdFl3QvQwsN41UztGdyBWWaQvSQB0iagag/MP8xrFYR//MxA4TaQ
kyZxjpnqKUZuNSCVg63iyAHRDvx3WM4/f/Xigp1D+8arMlBesG6NXUyuryRfaGbK
8hDiAyPLTf+conzAjSRA9emTUnyEKho57vYRljoJAEUoK3wXkSKSlhK6iIeEYTaM
BQIDAQAB
-----END PUBLIC KEY-----\`;

// 2. 规范化待签字符串拼接 (严格按字典序，保证跨语言一致)
function getCanonicalString(data: Record<string, any>): string {
  return Object.keys(data).sort().map(k => \`\${k}=\${data[k]}\`).join('&');
}

// 3. 采集机器指纹 (CPU型号 + 主机名 + 网卡MAC)
export function getMachineFingerprint(): string {
  const cpus = os.cpus().map(c => c.model).join(',');
  const hostname = os.hostname();
  const network = JSON.stringify(os.networkInterfaces());
  return crypto.createHash('sha256').update(cpus + hostname + network).digest('hex');
}

// 4. 卡密联网校验主流程
export async function verifyLicenseOnline(cardKey: string) {
  const machineId = getMachineFingerprint();
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const API_URL = 'https://thinkai.vip/api/license/verify';

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_key: cardKey, machine_id: machineId, nonce, timestamp })
  });

  const body = await res.json();
  if (body.code !== 0 || !body.data) {
    throw new Error(body.message || '卡密无效或已达到最大绑定设备上限');
  }

  // 4.1 校验服务端返回的 Nonce 是否与本地发送的完全一致 (防重放攻击)
  if (body.data.nonce !== nonce) {
    throw new Error('安全警告：检测到 Nonce 不匹配，可能遭遇重放攻击！');
  }

  // 4.2 执行标准 RSA-SHA256 公钥验签
  const canonical = getCanonicalString(body.data);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical);
  const isValid = verifier.verify(OFFICIAL_PUBLIC_KEY, body.signature, 'base64');

  if (!isValid) {
    throw new Error('严重警告：服务端签名校验失败，数据可能已被中间人篡改！');
  }

  // 4.3 验签成功：使用 safeStorage 加密写入本地安全缓存 (带 72 小时离线宽限时钟)
  const cachePayload = JSON.stringify({
    data: body.data,
    signature: body.signature,
    cached_at: Date.now(),
    grace_hours: 72
  });
  
  // 若支持 safeStorage，使用 OS 密钥链加密存储
  const encryptedBuf = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(cachePayload)
    : Buffer.from(cachePayload);

  // 写入本地安全凭据文件
  require('fs').writeFileSync('license.dat', encryptedBuf);

  return { success: true, plan: body.data.plan, maxDevices: body.data.max_devices };
}
`;

// 3. Dujiao-Next 与 Cloudflare 授权无缝桥接 (Worker 实时反查模式，免消息队列)
export const DUJIAO_BRIDGE_SNIPPET = `/**
 * Cloudflare Worker: Dujiao-Next 卡密实时反查授权中心
 * 原理：买家在软件输入卡密时，Worker 实时调用 Dujiao-Next API 核实订单状态
 * 优势：彻底无需在商城端搞复杂的 Webhook 重试队列，天然免疫跨网络丢单！
 */

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    if (url.pathname === '/api/license/activate' && request.method === 'POST') {
      const { license_key, machine_id } = await request.json();

      // 1. 先检查 Cloudflare D1/KV 中是否已有该卡密的激活记录
      const existing = await env.DB.prepare(
        "SELECT * FROM licenses WHERE license_key = ?"
      ).bind(license_key).first();

      if (existing) {
        // 已有记录，检查机器码是否一致
        if (existing.bound_machine_id && existing.bound_machine_id !== machine_id) {
          return Response.json({ valid: false, message: '该卡密已在其他电脑激活！' }, { status: 403 });
        }
        return Response.json({ valid: true, expires_at: existing.expires_at, plan: existing.plan_type });
      }

      // 2. 首次激活：调用 Dujiao-Next 发卡商城的订单查询 API
      const DUJIAO_API_URL = 'https://shop.yourdomain.com/api/v1/order/check-carmis';
      const verifyRes = await fetch(DUJIAO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.DUJIAO_API_KEY
        },
        body: JSON.stringify({ carmi: license_key })
      });

      const dujiaoData = await verifyRes.json();
      if (!verifyRes.ok || !dujiaoData.is_valid_and_paid) {
        return Response.json({ valid: false, message: '未找到已付款的有效订单卡密' }, { status: 400 });
      }

      // 3. 校验通过，写入 Cloudflare D1 数据库锁定机器码
      await env.DB.prepare(
        "INSERT INTO licenses (id, license_key, bound_machine_id, status, plan_type, activated_at) VALUES (?, ?, ?, 'ACTIVE', ?, ?)"
      ).bind(crypto.randomUUID(), license_key, machine_id, dujiaoData.plan_type || 'pro', Date.now());

      return Response.json({
        valid: true,
        message: '激活成功，已绑定当前设备',
        grace_period_hours: 72
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};`;

export function CodeBlueprintViewer() {
  const [activeTab, setActiveTab] = useState<'worker' | 'schema' | 'client' | 'dujiao_bridge'>('dujiao_bridge');
  const [copied, setCopied] = useState(false);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'worker':
        return WORKER_IMPLEMENTATION_CODE;
      case 'schema':
        return CLOUDFLARE_D1_SCHEMA;
      case 'client':
        return CLIENT_CODE_SNIPPET;
      case 'dujiao_bridge':
        return DUJIAO_BRIDGE_SNIPPET;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-6 shadow-xl mb-10 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">生产级代码与数据库结构落地模板</h3>
            <p className="text-xs text-slate-400">支持独立 Serverless 部署与 Dujiao-Next 原生桥接</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex flex-wrap text-xs">
            <button
              onClick={() => setActiveTab('dujiao_bridge')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dujiao_bridge' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Dujiao-Next 桥接 CF (实时反查模式)
            </button>
            <button
              onClick={() => setActiveTab('worker')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'worker' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              CF Worker 支付&授权一体
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schema' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Cloudflare D1 (SQL) 表结构
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'client' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              客户端机器码校验逻辑
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制代码</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="font-mono text-xs text-slate-300 bg-slate-900/90 p-4 rounded-xl overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
          {getCurrentCode()}
        </pre>
      </div>
    </div>
  );
}
