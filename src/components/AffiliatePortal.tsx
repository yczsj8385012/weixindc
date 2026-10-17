import React, { useState } from 'react';
import { 
  Users, Link, Copy, Check, DollarSign, TrendingUp, Wallet, ArrowUpRight, 
  ShieldCheck, Sparkles, Download, Layers, Settings, FileCode, CheckCircle2,
  Share2, QrCode, Cpu, ArrowRight, PackageCheck, AlertCircle, GitFork,
  Network, ShieldAlert, Database, RefreshCw, Send, CheckCircle
} from 'lucide-react';
import JSZip from 'jszip';

interface OrderItem {
  orderId: string;
  productName: string;
  amount: number;
  licenseKey: string;
  buyerEmail: string;
  referrerCode: string;
  commissionAmount: number;
  time?: string;
  parentCommission?: number;
  grandparentCommission?: number;
  grandparentCode?: string;
}

interface Props {
  orders: OrderItem[];
  currentAffiliateCode: string;
  onSetAffiliateCode: (code: string) => void;
}

export function AffiliatePortal({ orders, currentAffiliateCode, onSetAffiliateCode }: Props) {
  const [promoterCode, setPromoterCode] = useState(currentAffiliateCode || 'VIP888');
  const [copiedLink, setCopiedLink] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const [isBundlingZip, setIsBundlingZip] = useState(false);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'admin_grant' | 'xunhupay' | 'integration' | 'wholesale'>('overview');

  // Agent Commission Settings (Default 40% Tier-1)
  const [directRate, setDirectRate] = useState<number>(40); // 40% 一级合伙人分润
  
  // Admin Granted Agents List
  const [agentsList, setAgentsList] = useState<Array<{ code: string; name: string; rate: number; phone: string; date: string }>>([
    { code: 'VIP888', name: '官方核心合伙人 (金牌代理)', rate: 40, phone: '138****8888', date: '2026-10-15' },
    { code: 'AGENT_ZHANG', name: '华东渠道老张 (一级合伙人)', rate: 40, phone: '139****9999', date: '2026-10-16' },
  ]);
  const [newAgentCode, setNewAgentCode] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRate, setNewAgentRate] = useState(40);
  const [newAgentPhone, setNewAgentPhone] = useState('');
  
  // XunhuPay (虎皮椒) Config Simulator
  const [xunhuAppId, setXunhuAppId] = useState('202610168899');
  const [xunhuAppSecret, setXunhuAppSecret] = useState('d3b07384d113edec49eaa6238ad5ff00');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  // Two-tier commission calculation
  const affiliateOrders = orders.filter(
    o => o.referrerCode === promoterCode || (promoterCode === 'VIP888' && (o.referrerCode === 'DIRECT-OFFICIAL' || !o.referrerCode))
  );

  // Direct commission (一级代理 40% 分润)
  const directTotal = affiliateOrders.reduce((sum, o) => {
    return sum + (o.commissionAmount || (o.amount * (directRate / 100)));
  }, 0);

  const totalCommission = directTotal;
  const totalSales = affiliateOrders.reduce((sum, o) => sum + o.amount, 0);

  const referralUrl = `${window.location.origin}/?ref=${promoterCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyWithdraw = () => {
    if (totalCommission <= 0) {
      alert('当前可提现余额为 ¥0，请先分享专属分发包或链接出单！');
      return;
    }
    setWithdrawStatus(`提现申请已受理！当前一级代理可提现分润共计 ¥${totalCommission.toFixed(2)}，将通过微信商家转账到零钱直达。`);
    setTimeout(() => setWithdrawStatus(null), 6000);
  };

  // Agent-branded ZIP packager
  const handleDownloadAgentZip = async () => {
    setIsBundlingZip(true);
    try {
      const zip = new JSZip();

      // Channel Config with agent and pure Level-1 architecture
      zip.file(
        'channel_config.json',
        JSON.stringify(
          {
            channel_agent: promoterCode,
            agent_tier: 'tier_1_exclusive',
            commission_rate: directRate / 100,
            authority_server: 'https://api.thinkai.vip',
            client_app: 'thinkai-wechat-assistant',
            offline_grace_hours: 72
          },
          null,
          2
        )
      );

      // Launcher
      zip.file(
        `一键运行助手[一级代理-${promoterCode}专属版].bat`,
        `@echo off
chcp 65001 >nul
title 微信群及好友数据导出助手 - 一级合伙人[${promoterCode}]专属版
echo ========================================================
echo   微信群及好友数据导出助手 (一级代理专属分发版)
echo   渠道编号: ${promoterCode} (享官方 ${directRate}% 专属分润)
echo   云端授权节点: https://api.thinkai.vip
echo ========================================================
echo 正在启动客户端并注入渠道分成标记...
timeout /t 1 >nul
if exist "ThinkAI_Assistant.exe" (
    start "" "ThinkAI_Assistant.exe" --channel=${promoterCode}
) else (
    echo [提示] 绿色客户端启动环境已就绪。
    echo 客户端已永久绑定代理代码 [${promoterCode}]，所有购买激活均计入您的裂变体系！
    pause
)
exit
`
      );

      // Readme for Agent's customer
      zip.file(
        'README_客户激活与售后保障.txt',
        `========================================================
  微信群及好友数据导出助手 · 官方正版 (渠道专属版)
========================================================
您好！这是由官方授权渠道 [${promoterCode}] 提供的正版分发软件。
1. 解压后双击运行启动器；
2. 在弹出窗口中输入官方卡密激活即可；
3. 如需购买卡密，可直接联系为您提供本软件的推荐人 [${promoterCode}]，或访问官方商城：${referralUrl}
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ThinkAI_Wechat_Assistant_Agent_${promoterCode}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('生成专属包失败: ' + err.message);
    } finally {
      setIsBundlingZip(false);
    }
  };

  // Simulate XunhuPay Webhook execution in single atomic transaction
  const handleSimulateWebhook = () => {
    setSimulatingWebhook(true);
    setWebhookStatus(null);
    setTimeout(() => {
      setWebhookStatus('【原子事务执行成功】接收虎皮椒 Webhook 回调 ──> 校验 MD5 签名通过 ──> 单一 SQL 事务同时写入：① 订单 ORD-SIM-' + Math.floor(Math.random() * 89999 + 10000) + ' 标记已付；② 动态生成 RSA-2048 卡密 VIP-2026-YEAR-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '；③ 给一级代理(' + promoterCode + ')记账 40% 分润 ¥' + (99 * directRate / 100).toFixed(2) + '；④ 平台留存 ¥' + (99 * (100 - directRate) / 100).toFixed(2) + '。零掉单保证！');
      setSimulatingWebhook(false);
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GitFork className="w-4 h-4 text-purple-500" />
            <span>彻底消除系统割裂 · 二级推广返佣 & 虎皮椒全渠道结合中枢</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            代理分账中枢与四大核心痛点终极落地平台
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            彻底解决 Dujiao-Next 硬伤：原生支持二级裂变（直推+间推团队提成） · 虎皮椒免执照收款 · 发卡即授权零丢单
          </p>
        </div>

        {/* Agent Switcher */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-medium">当前渠道大队长：</span>
          <input
            type="text"
            value={promoterCode}
            onChange={(e) => {
              const code = e.target.value.toUpperCase();
              setPromoterCode(code);
              onSetAffiliateCode(code);
            }}
            className="w-28 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 focus:outline-none uppercase"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>分润统计与出单看板</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_grant')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admin_grant'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>【管理员赋权】授权一级代理 (直享40%)</span>
        </button>

        <button
          onClick={() => setActiveTab('xunhupay')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'xunhupay'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>虎皮椒免执照通道 & 原子事务</span>
        </button>

        <button
          onClick={() => setActiveTab('integration')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'integration'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>客户端与分账软件结合规范</span>
        </button>

        <button
          onClick={() => setActiveTab('wholesale')}
          className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'wholesale'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>代理 6 折批量拿货通道</span>
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Download Agent Branded Zip Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>一级大队长专属绿色分发包</span>
              </div>
              <h3 className="text-lg font-bold">
                一键生成并打包代理专属客户端压缩包 (.zip)
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                包内自动写入您的专属渠道配置文件 <code className="text-emerald-400 font-mono">channel_config.json</code>（代理码：{promoterCode}）。客户解压后运行，购买激活终身锁定您的直推与二级团队分成！
              </p>
            </div>

            <button
              onClick={handleDownloadAgentZip}
              disabled={isBundlingZip}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isBundlingZip ? '正在打包专属分发包...' : `下载 [${promoterCode}] 专属绿色分发包`}</span>
            </button>
          </div>

          {/* Share Link Box */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Link className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  您的线上商城专属推广链接 (带参跟踪):
                </div>
                <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate max-w-md">
                  {referralUrl}
                </div>
              </div>
            </div>

            <button
              onClick={copyLink}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '推广链接已复制' : '复制推广链接'}</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">渠道直推与裂变出单</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {affiliateOrders.length} <span className="text-xs font-normal text-slate-400">单</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">渠道推广出单</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {affiliateOrders.length} <span className="text-xs font-normal text-slate-400">单</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-400 block mb-1">累计促成流水</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ¥{totalSales.toFixed(2)}
              </span>
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block mb-1">一级代理分润比例</span>
              <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                {directRate}%
              </span>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">累计可提现收益</span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                ¥{totalCommission.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Withdraw CTA */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                佣金自动结算提现
              </span>
              <span className="text-[11px] text-slate-500">
                支持微信商家转账到零钱直达，单笔满 1 元即可提现，T+0 秒级到账
              </span>
            </div>
            <button
              onClick={handleApplyWithdraw}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-sm"
            >
              申请佣金提现
            </button>
          </div>

          {withdrawStatus && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{withdrawStatus}</span>
            </div>
          )}

          {/* Order Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              渠道客户出单明细流水 (40% 专属分润)
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">订单编号</th>
                      <th className="p-3">购买套餐</th>
                      <th className="p-3">客户邮箱</th>
                      <th className="p-3">实付金额</th>
                      <th className="p-3">一级代理分成 ({directRate}%)</th>
                      <th className="p-3">下发卡密</th>
                      <th className="p-3">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {affiliateOrders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{order.orderId}</td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">{order.productName}</td>
                        <td className="p-3 font-mono text-slate-500">{order.buyerEmail}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">¥{order.amount.toFixed(2)}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +¥{(order.amount * (directRate / 100)).toFixed(2)}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{order.licenseKey}</td>
                        <td className="p-3 text-slate-400">{order.time || '刚刚'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Admin Grants Level-1 Agent (管理员赋权一级代理) */}
      {activeTab === 'admin_grant' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>管理员赋权中心：我给权限，他就是一级代理 (享 40% 分润)</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              无需任何复杂多级金字塔或传销风险！完全由您人工审核并授予代理权限。一旦录入代理代号，系统立即为他生成专属带参链接与专属绿色客户端分发包，客户出单后 40% 佣金自动结算到该代理名下。
            </p>
          </div>

          {/* Add New Agent Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>新增授权一位一级合伙人</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  代理唯一代号 (例如: AGENT_A)
                </label>
                <input
                  type="text"
                  placeholder="AGENT_003"
                  value={newAgentCode}
                  onChange={(e) => setNewAgentCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg font-mono uppercase bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  合伙人称呼 / 备注
                </label>
                <input
                  type="text"
                  placeholder="例如: 杭州渠道老李"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  联系手机 / 微信
                </label>
                <input
                  type="text"
                  placeholder="13800000000"
                  value={newAgentPhone}
                  onChange={(e) => setNewAgentPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  分润比例 (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newAgentRate}
                    onChange={(e) => setNewAgentRate(Number(e.target.value))}
                    className="w-20 px-3 py-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                  <button
                    onClick={() => {
                      if (!newAgentCode.trim()) {
                        alert('请输入代理代号！');
                        return;
                      }
                      setAgentsList(prev => [
                        ...prev,
                        {
                          code: newAgentCode.trim().toUpperCase(),
                          name: newAgentName || '一级渠道合伙人',
                          rate: newAgentRate,
                          phone: newAgentPhone || '未填写',
                          date: new Date().toISOString().split('T')[0]
                        }
                      ]);
                      setNewAgentCode('');
                      setNewAgentName('');
                      setNewAgentPhone('');
                      alert('已成功授予一级代理权限！');
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                  >
                    授权开通
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Authorized Agents List */}
          <div className="space-y-3">
            <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              当前已授权的一级合伙人名册 ({agentsList.length} 位)
            </h5>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">代理代号</th>
                    <th className="p-3">合伙人称呼</th>
                    <th className="p-3">联系方式</th>
                    <th className="p-3">直推分成比例</th>
                    <th className="p-3">授权日期</th>
                    <th className="p-3">专属推广链接</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agentsList.map((agent) => (
                    <tr key={agent.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{agent.code}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{agent.name}</td>
                      <td className="p-3 font-mono text-slate-500">{agent.phone}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{agent.rate}% (¥{99 * agent.rate / 100})</td>
                      <td className="p-3 text-slate-400">{agent.date}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {window.location.origin}/?ref={agent.code}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setPromoterCode(agent.code);
                            onSetAffiliateCode(agent.code);
                            setActiveTab('overview');
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                        >
                          切换到该代理工作台
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* TAB 3: XunhuPay (虎皮椒免执照通道 & 原子事务) */}
      {activeTab === 'xunhupay' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>解决痛点 2 & 4：虎皮椒个人免执照正规通道与「发卡即授权」零丢单事务</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              杜绝个人微信/支付宝挂机免签软件封号风险！通过虎皮椒正规通道代收，微信支付宝扫码支付成功后，Webhook 直接通知云端，在<strong>单一数据库原子事务</strong>中完成「标记付款 + 动态 RSA 卡密签发 + 绑定机器码 + 一二级分销记账」，彻底消灭跨系统割裂掉单！
            </p>
          </div>

          {/* Config Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                虎皮椒 (XunhuPay) 商户参数配置
              </h5>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    虎皮椒 AppID
                  </label>
                  <input
                    type="text"
                    value={xunhuAppId}
                    onChange={(e) => setXunhuAppId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    虎皮椒 AppSecret (通信密钥)
                  </label>
                  <input
                    type="password"
                    value={xunhuAppSecret}
                    onChange={(e) => setXunhuAppSecret(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    异步通知 Webhook URL (由云端实时接听)
                  </label>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg font-mono text-[11px] text-emerald-600 dark:text-emerald-400 select-all">
                    https://api.thinkai.vip/api/payment/webhook
                  </div>
                </div>
              </div>
            </div>

            {/* Atomic Transaction Simulator */}
            <div className="border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-xs text-indigo-950 dark:text-indigo-200 uppercase tracking-wider mb-2">
                  单一原子事务零丢单演练器
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  模拟当买家微信扫码付款成功后，虎皮椒发起 Webhook 回调，系统如何在同一事务内同时执行 4 个动作，杜绝“扣了钱但卡密没生成”或“分销漏记账”：
                </p>

                <div className="space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  <div>1. BEGIN TRANSACTION;</div>
                  <div>2. UPDATE orders SET status='PAID' WHERE id=?;</div>
                  <div>3. INSERT INTO licenses (card_key, rsa_sig, machines);</div>
                  <div>4. INSERT INTO commission_ledger (parent, grandparent, amount);</div>
                  <div>5. COMMIT;</div>
                </div>
              </div>

              <button
                onClick={handleSimulateWebhook}
                disabled={simulatingWebhook}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simulatingWebhook ? 'animate-spin' : ''}`} />
                <span>{simulatingWebhook ? '正在执行原子事务...' : '模拟虎皮椒真实支付回调 (测试原子出卡)'}</span>
              </button>
            </div>
          </div>

          {/* Webhook Execution Result */}
          {webhookStatus && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              {webhookStatus}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Integration Spec */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>客户端解压包与分账系统的三维无缝结合规范</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              通过「客户端本地捆绑 + 线上 30 天 Cookie 跟踪 + Webhook 自动分账」三大维度，确保一级和二级代理名下所有出单自动计提。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mode 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                解压包内置渠道码
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                代理下载专属 ZIP 时，包内自动嵌入 <code className="font-mono text-indigo-600">channel_config.json</code>。客户端启动时自动上报该代理代号，终身锁定客户关系。
              </p>
            </div>

            {/* Mode 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                Web 商城 30 天 Cookie 跟踪
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                客户通过专属链接 <code className="font-mono text-indigo-600">?ref=VIP888</code> 进入商城，系统在客户浏览器写入 30 天归因标识。30 天内任何付款均自动分账。
              </p>
            </div>

            {/* Mode 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                服务商分账 Webhook 自动出款
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                微信商家转账到零钱直达代理微信，全天候无人值守自动分润。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Wholesale */}
      {activeTab === 'wholesale' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-5 space-y-2">
            <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>一级代理 6 折底价批量提卡中心</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              除线上分佣外，一级代理可直接按 6 折批发底价提前批量提卡，自主在微信朋友圈、私域、闲鱼或淘宝上架售卖。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  三个月标准卡 (支持1台)
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
                  官方标价 ¥29.9
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                  ¥17.94
                </span>
                <span className="text-xs text-slate-400">/ 代理批发底价 (6折)</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>● 建议零售价：¥29.9 ~ ¥39.9</div>
                <div>● 每单直接净赚：<strong>¥11.96 ~ ¥21.96</strong></div>
              </div>
            </div>

            <div className="border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-5 space-y-4 bg-indigo-50/20 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  年度商业尊享版 (支持3台)
                </span>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-mono">
                  官方标价 ¥99
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  ¥59.40
                </span>
                <span className="text-xs text-slate-400">/ 代理批发底价 (6折)</span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div>● 建议零售价：¥99 ~ ¥129</div>
                <div>● 每单直接净赚：<strong>¥39.60 ~ ¥69.60</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
