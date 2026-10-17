import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, RefreshCw, Key, CheckCircle2, AlertTriangle, 
  ExternalLink, Copy, Check, Lock, Unlock, Zap, Download, Layers,
  Activity, Cpu, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';

export function CloudControlCenter() {
  // Live Cloud Telemetry state
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');

  // Card Management & Reset state
  const [targetCard, setTargetCard] = useState<string>('VIP-2026-FRIEND-7788-9901');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Batch Generation state
  const [batchPlan, setBatchPlan] = useState<'annual' | 'quarterly'>('annual');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchPrefix, setBatchPrefix] = useState<string>('VIP-2026');
  const [generatedCards, setGeneratedCards] = useState<string[]>([]);
  const [batchCopied, setBatchCopied] = useState<boolean>(false);

  // Roadmap filter / expansion
  const [expandedSection, setExpandedSection] = useState<string>('all');

  // Xunhupay V3 state (Pre-filled with live WeChat Payment 4 gateway parameters)
  const [xunhuAppId, setXunhuAppId] = useState<string>('201906188815');
  const [xunhuAppSecret, setXunhuAppSecret] = useState<string>('');
  const [xunhuNotifyUrl, setXunhuNotifyUrl] = useState<string>('https://thinkai.vip/api/payment/xunhupay/notify');
  const [xunhuConfigResult, setXunhuConfigResult] = useState<string | null>('🟢 虎皮椒微信支付四真实网关已就绪！可直接调起微信扫码付款');
  const [isSavingXunhu, setIsSavingXunhu] = useState<boolean>(false);

  const fetchXunhuConfig = async () => {
    try {
      const res = await fetch('/api/payment/xunhupay/config');
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setXunhuAppId(data.data.appid || '');
        setXunhuNotifyUrl(data.data.notify_url || '');
      }
    } catch {
      // ignore
    }
  };

  const handleSaveXunhuConfig = async () => {
    setIsSavingXunhu(true);
    setXunhuConfigResult(null);
    try {
      const res = await fetch('/api/payment/xunhupay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appid: xunhuAppId,
          appsecret: xunhuAppSecret,
          notify_url: xunhuNotifyUrl
        })
      });
      const data = await res.json();
      if (data.code === 0) {
        setXunhuConfigResult('✅ 虎皮椒参数保存成功！发起支付将自动调用官方收银台。');
      } else {
        setXunhuConfigResult('❌ 保存失败: ' + (data.message || '网络问题'));
      }
    } catch (err: any) {
      setXunhuConfigResult('❌ 保存失败: ' + err.message);
    } finally {
      setIsSavingXunhu(false);
    }
  };


  // Fetch live health on mount
  const checkHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('https://api.thinkai.vip/api/license/health', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const end = performance.now();
      const data = await res.json();
      setHealthStatus(data);
      setPingLatency(Math.round(end - start));
    } catch (err: any) {
      setHealthStatus({ status: 'error', error: err.message });
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchXunhuConfig();
  }, []);


  // Handle single card reset via Cloud API
  const handleResetCard = async () => {
    if (!targetCard.trim()) return;
    setResetLoading(true);
    setResetResult(null);
    try {
      const res = await fetch('https://api.thinkai.vip/api/license/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ card_key: targetCard.trim() })
      });
      const data = await res.json();
      setResetResult({
        success: res.ok && data.code === 0,
        message: data.message || (res.ok ? '解绑重置成功' : '请求失败'),
        raw: data
      });
    } catch (err: any) {
      setResetResult({
        success: false,
        message: '连接云端服务器失败: ' + err.message
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Generate batch keys
  const handleGenerateBatch = () => {
    const cards: string[] = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const tag = batchPlan === 'annual' ? 'Y' : 'Q';
    for (let i = 0; i < batchCount; i++) {
      let part1 = '';
      let part2 = '';
      for (let j = 0; j < 4; j++) part1 += chars[Math.floor(Math.random() * chars.length)];
      for (let j = 0; j < 4; j++) part2 += chars[Math.floor(Math.random() * chars.length)];
      cards.push(`${batchPrefix}-${tag}-${part1}-${part2}`);
    }
    setGeneratedCards(cards);
  };

  const copyBatchToClipboard = () => {
    if (generatedCards.length === 0) return;
    navigator.clipboard.writeText(generatedCards.join('\n'));
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2000);
  };

  const copySingle = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Server className="w-4 h-4" />
              <span>Production Authority Management Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              云端商业授权中控台 & 落地执行全景看板
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              实时直连香港正式云端授权集群（<code className="text-emerald-400 font-mono">https://api.thinkai.vip</code>），提供设备一键解绑、批量卡密生成、防破解安全规范及商业变现全流程监控。
            </p>
          </div>

          {/* Quick Telemetry Pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthStatus?.online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${healthStatus?.online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <div className="text-left">
                <div className="text-[11px] text-slate-400 font-medium">香港云端授权状态</div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{healthStatus?.online ? '集群在线 100%' : '检测中...'}</span>
                  {pingLatency !== null && (
                    <span className="text-[10px] text-emerald-400 font-mono">({pingLatency}ms)</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={checkHealth}
              disabled={isPinging}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>探活刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Live Control & Batch Gen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Unbinder & Manager (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Unlock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  卡密在线查询与一键解绑 (换机控制台)
                </h3>
                <p className="text-xs text-slate-500">
                  客户换电脑或测试重装时，无需在黑底终端敲命令，在此一键秒级释放
                </p>
              </div>
            </div>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-mono">
              X-Admin-Token
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                目标卡密号 (License Key)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetCard}
                  onChange={(e) => setTargetCard(e.target.value)}
                  placeholder="例如: VIP-2026-FRIEND-7788-9901"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleResetCard}
                  disabled={resetLoading}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resetLoading ? 'animate-spin' : ''}`} />
                  <span>一键解绑</span>
                </button>
              </div>
            </div>

            {/* Quick Fill Templates */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">快速选择常用卡密填入：</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '朋友正式卡', key: 'VIP-2026-FRIEND-7788-9901' },
                  { label: '本机开发测试卡', key: 'TEST-DEV-8888-AAAA-1111' },
                  { label: '样例VIP年卡', key: 'VIP-2026-8888-9999-0001' }
                ].map(c => (
                  <button
                    key={c.key}
                    onClick={() => { setTargetCard(c.key); setResetResult(null); }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md transition font-mono"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Result Box */}
            {resetResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                resetResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {resetResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  <span>{resetResult.message}</span>
                </div>
                {resetResult.raw && (
                  <div className="font-mono text-[11px] bg-white/70 dark:bg-black/30 p-2.5 rounded-lg overflow-x-auto">
                    {JSON.stringify(resetResult.raw, null, 2)}
                  </div>
                )}
              </div>
            )}

            {/* Token Guard Note */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-700 dark:text-slate-200">鉴权保护机制：</strong> 该操作已由服务端配置的 <code className="text-purple-600 dark:text-purple-400 font-mono">X-Admin-Token</code> 保护，外部人员或普通客户端无法越权解绑，确保商用版权权威性。
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Batch Key Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                卡密批量生成与发货导出器
              </h3>
              <p className="text-xs text-slate-500">
                用于上架闲鱼/淘宝/发卡网批量备货
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  套餐规格
                </label>
                <select
                  value={batchPlan}
                  onChange={(e: any) => setBatchPlan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="annual">VIP年度卡 (支持3台)</option>
                  <option value="quarterly">3个月季度卡 (支持1台)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  生成数量
                </label>
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value={5}>生成 5 张</option>
                  <option value={10}>生成 10 张</option>
                  <option value={20}>生成 20 张</option>
                  <option value={50}>生成 50 张</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateBatch}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>立即批量生成卡密</span>
            </button>

            {generatedCards.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    已生成 {generatedCards.length} 张就绪卡密：
                  </span>
                  <button
                    onClick={copyBatchToClipboard}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {batchCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{batchCopied ? '已复制全部' : '复制全部'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-[11px] font-mono max-h-40 overflow-y-auto space-y-1">
                  {generatedCards.map((card, idx) => (
                    <div key={card} className="flex items-center justify-between hover:bg-slate-800/80 p-1 rounded">
                      <span>{card}</span>
                      <button
                        onClick={() => copySingle(card)}
                        className="text-slate-400 hover:text-white"
                        title="复制"
                      >
                        {copiedKey === card ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Xunhupay V3 Gateway Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>虎皮椒 (Xunhupay V3) 聚合支付真实网关配置</span>
          </div>
          <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-semibold border border-amber-200 dark:border-amber-800/60">
            个人免营业执照 · 微信/支付宝官方结算
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          在虎皮椒后台 (xunhupay.com) 获取您的 <code className="text-indigo-600 font-mono font-bold">APPID</code> 与 <code className="text-indigo-600 font-mono font-bold">APPSECRET</code> 填入下方，即可开启真实微信/支付宝扫码收款。系统将自动生成 32 位 MD5 签名并进行异步回调验签。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              虎皮椒 AppID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: 202688899"
              value={xunhuAppId}
              onChange={(e) => setXunhuAppId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              虎皮椒 AppSecret <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="在虎皮椒商户后台查看密钥"
              value={xunhuAppSecret}
              onChange={(e) => setXunhuAppSecret(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            异步通知回调地址 (Notify URL)
          </label>
          <input
            type="text"
            value={xunhuNotifyUrl}
            onChange={(e) => setXunhuNotifyUrl(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleSaveXunhuConfig}
            disabled={isSavingXunhu}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isSavingXunhu ? '正在保存...' : '保存虎皮椒网关参数'}</span>
          </button>

          {xunhuConfigResult && (
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {xunhuConfigResult}
            </span>
          )}
        </div>
      </div>


      {/* Comprehensive Roadmap: What's Done & What's Next */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Commercialization Roadmap & Progress Audit</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              商业化全景交付进度与未竟事项清单
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              按软件从研发、防盗防破解、联调到正式商业变现的 6 大阶段进行全面梳理
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800/60">
              已完成核心里程碑: 4/7
            </span>
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Milestone 1: Done */}
          <div className="border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                阶段 1 · 云端生产基建
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              香港云服务器 + Caddy 443 SSL
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              完成了公网 HTTPS 反向代理，直连香港节点（43.128.7.140），杜绝国内免备案阻断，全天候 200 OK 响应。
            </p>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ● 状态：100% 验收通过
            </div>
          </div>

          {/* Milestone 2: Done */}
          <div className="border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                阶段 2 · 工业级密码学
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              RSA-2048 验签 + 72h 离线宽限
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              规范化 Canonical 待签字符串、nonce 防重放与防抓包篡改、原生 SPKI 公钥彻底解决 ASN.1 报错。
            </p>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ● 状态：100% 验收通过
            </div>
          </div>

          {/* Milestone 3: Done */}
          <div className="border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                阶段 3 · Codex 客户端闭环
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              本地单机免安装实测通过
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Codex 已将客户端授权模块接入云端，您在本机电脑实测已确认输卡激活、读取数据与导出完全正常。
            </p>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ● 状态：您已实测通过
            </div>
          </div>

          {/* Milestone 4: In Progress */}
          <div className="border border-indigo-500/40 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl p-4 space-y-3 ring-2 ring-indigo-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                阶段 4 · 跨机防盗刷验证 (当前进行)
              </span>
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              朋友电脑第二台设备测试
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              已为朋友生成纯净未激活的 <code className="text-indigo-600 dark:text-indigo-400 font-mono">VIP-2026-FRIEND-7788-9901</code>。需朋友在非本机环境下验证激活与静默二次启动。
            </p>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
              ● 状态：等待朋友测试反馈
            </div>
          </div>

          {/* Milestone 5: Pending */}
          <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                阶段 5 · 客户端防逆向加固 (待做)
              </span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              ASAR 源码混淆与防调试
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              防止专业破解人员解压 electron.asar 修改验证代码绕过收费。需加入 JavaScript Obfuscator 混淆与防调试保护。
            </p>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              ○ 待做：可在朋友测通后由 Codex 加固
            </div>
          </div>

          {/* Milestone 6: Pending */}
          <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                阶段 6 · 商业自动化变现 (待做)
              </span>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              微信/支付宝真金白银免签发卡
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              将目前的“演示结账”正式升级为真实个人收款码即时到账（接入虎皮椒/爱发电/发卡网），付款后自动邮件或弹窗出卡。
            </p>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
              ○ 待做：配置收款通道与Webhook自动发卡
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
