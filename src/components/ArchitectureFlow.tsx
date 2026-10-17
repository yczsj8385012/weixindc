import { useState } from 'react';
import { Layers, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, KeyRound, Server, Laptop, Lock } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  actor: string;
  actorColor: string;
  summary: string;
  details: string;
  samplePayload?: string;
  securityNotice: string;
}

const FLOW_STEPS: Step[] = [
  {
    id: 1,
    title: '商品下单与推广链绑定',
    actor: '买家端 (Web / H5)',
    actorColor: 'bg-blue-500 text-white',
    summary: '买家通过推广链接访问，前端自动捕获 URL 中的 ref_id 并持久化到本地 Cookie/Session',
    details: '下订单时，提交商品ID (如 PRO-YEARLY)、买家邮箱、以及绑定的邀请人 ID (Parent ID)。若邀请人本身也有上级，在后端查询并形成两级链条。',
    samplePayload: `{
  "product_id": "software_pro_yearly",
  "buyer_email": "user@example.com",
  "referrer_code": "VIP888", // 一级推广码
  "amount": 199.00
}`,
    securityNotice: '防刷保护：如果买家邮箱或设备指纹与推广人相同，判定为自推自买，拒绝绑定分销提成。'
  },
  {
    id: 2,
    title: '微信/支付宝收银台付款',
    actor: '支付渠道 (WeChat/Alipay)',
    actorColor: 'bg-emerald-600 text-white',
    summary: '调用官方商户号或虎皮椒创建预支付订单，返回微信原生收银台或手机唤醒支付链接',
    details: '买家通过手机微信或支付宝完成扫码付款。资金进入商家账户，支付渠道生成全网唯一流水号 (trade_no)。',
    samplePayload: `{
  "trade_no": "20261016220014890123456789",
  "out_trade_no": "ORD_982347192",
  "trade_status": "TRADE_SUCCESS",
  "total_amount": "199.00"
}`,
    securityNotice: '严密验签：支付网关调用回调时带有签名 (sign)，必须使用商户私钥严格校验，防伪造假支付请求。'
  },
  {
    id: 3,
    title: 'Webhook 触发与 D1 原子事务',
    actor: 'Cloudflare Worker & D1',
    actorColor: 'bg-indigo-600 text-white',
    summary: 'Cloudflare Worker 接收异步回调，单次 SQL 事务完成发卡、订单标记与二级佣金记账',
    details: '此步彻底解决割裂问题：传统发卡系统与授权系统分离容易因断网导致卡密未同步；而全在 Cloudflare D1 执行事务，保证 100% 成功交付。',
    samplePayload: `// D1 Batch Transaction:
BEGIN TRANSACTION;
UPDATE licenses SET status = 'ACTIVE', order_id = 'ORD_982347192' WHERE id = 'LIC_001';
UPDATE orders SET status = 'PAID' WHERE id = 'ORD_982347192';
UPDATE users SET wallet_balance = wallet_balance + 39.8 WHERE id = 'PARENT_USER'; // 20%
UPDATE users SET wallet_balance = wallet_balance + 19.9 WHERE id = 'GRANDPARENT_USER'; // 10%
COMMIT;`,
    securityNotice: '幂等性控制：以 trade_no 或 out_trade_no 做唯一键，防止支付渠道重试推送导致重复发放佣金与多张卡密。'
  },
  {
    id: 4,
    title: '卡密即时展示与邮件推送',
    actor: '交付服务 (Delivery)',
    actorColor: 'bg-amber-500 text-white',
    summary: '商城前台轮询获悉支付成功，实时展示激活码 PRO-89FE-77B2-9901，并自动抄送交付邮件',
    details: '买家复制此卡密即可在软件客户端激活。即使买家误关网页，也可凭邮箱随时自助提取卡密。',
    samplePayload: `{
  "license_key": "PRO-89FE-77B2-9901",
  "plan": "年度专业版",
  "expires_at": "2027-10-16",
  "allowed_devices": 1
}`,
    securityNotice: '安全防泄露：查询卡密时必须验证买家邮箱或订单查询密钥，防止暴力枚举他人卡密。'
  },
  {
    id: 5,
    title: '软件客户端首次激活与机器绑定',
    actor: '软件客户端 (Desktop/App)',
    actorColor: 'bg-slate-700 text-white',
    summary: '软件在用户电脑首次启动，采集硬件指纹计算 Machine ID，调用 Cloudflare Worker 绑定机器',
    details: 'Worker 校验卡密存在且为有效状态，将首次绑定的 Machine ID 写入 D1，并返回有时效的 JWT 授权 Token。',
    samplePayload: `// 客户端 POST /api/license/verify
{
  "license_key": "PRO-89FE-77B2-9901",
  "machine_id": "sha256(CPU_ID + MOTHERBOARD_UUID + MAC)",
  "app_version": "2.4.0",
  "timestamp": 1792195200
}`,
    securityNotice: '防止一码多用：一台机器绑定后，其他电脑若输入同一卡密将提示“已被其他设备绑定，请在后台解绑”。'
  },
  {
    id: 6,
    title: '周期性心跳与离线容错 (Grace Period)',
    actor: '心跳服务 (Heartbeat)',
    actorColor: 'bg-purple-600 text-white',
    summary: '软件每隔 24 小时向 Worker 静默上报心跳；断网时允许 72 小时离线宽限期',
    details: '既保障了软件随时能够响应退款封禁，又不会因为用户一时断网导致软件直接卡死无法工作。',
    samplePayload: `{
  "valid": true,
  "status": "ACTIVE",
  "heartbeat_interval_hours": 24,
  "grace_period_expires": "2026-10-19T10:00:00Z"
}`,
    securityNotice: '退款自动吊销：若用户申请退款，后台将 status 置为 REFUNDED，下次心跳客户端即刻吊销并锁定高级功能。'
  }
];

export function ArchitectureFlow() {
  const [activeStep, setActiveStep] = useState<number>(3);

  const current = FLOW_STEPS.find(s => s.id === activeStep) || FLOW_STEPS[2];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              发卡·分销·Cloudflare 授权全链路时序模拟
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            完美解决截图中所述“交付通知与退款处理断裂、不能把支付成功直接当成授权服务已收到”的关键难题
          </p>
        </div>
      </div>

      {/* Steps Progress Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        {FLOW_STEPS.map((step) => {
          const isCurrent = step.id === activeStep;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${step.actorColor}`}>
                  Step {step.id}
                </span>
                {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>}
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {step.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${current.actorColor}`}>
              责任方: {current.actor}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              步骤 {current.id}: {current.title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 font-medium">
          {current.summary}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {current.details}
        </p>

        {/* Code / Payload Sample */}
        {current.samplePayload && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>交互报文 / 逻辑参考:</span>
            </div>
            <pre className="bg-slate-900 text-slate-200 font-mono text-xs p-3.5 rounded-lg overflow-x-auto border border-slate-800">
              {current.samplePayload}
            </pre>
          </div>
        )}

        {/* Security Rule */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-300">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">核心防破与一致性法则：</strong>
            <span>{current.securityNotice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
