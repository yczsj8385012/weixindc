import React, { useState } from 'react';
import { 
  Users, Link, Copy, Check, DollarSign, TrendingUp, Wallet, ArrowUpRight, 
  ShieldCheck, Sparkles, Download, Layers, Settings, FileCode, CheckCircle2,
  Share2, QrCode, Cpu, ArrowRight, PackageCheck, AlertCircle, GitFork,
  Network, ShieldAlert, Database, RefreshCw, Send, CheckCircle, Eye,
  Lock, CreditCard, Building2, Clock, CheckCircle1, XCircle, ChevronRight, UserCheck,
  LogIn, UserPlus, Mail, Phone, MessageSquare, Shield
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
}

interface WithdrawalRecord {
  id: string;
  agentCode: string;
  amount: number;
  method: 'wechat' | 'alipay' | 'bank';
  accountName: string;
  accountNo: string;
  status: 'pending' | 'completed' | 'rejected';
  applyTime: string;
  payTime?: string;
  txRef?: string;
  note?: string;
}

interface AgentApplication {
  id: string;
  name: string;
  phone: string;
  wechat: string;
  channel: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
}

interface Props {
  orders: OrderItem[];
  currentAffiliateCode: string;
  onSetAffiliateCode: (code: string) => void;
}

export function AffiliatePortal({ orders, currentAffiliateCode, onSetAffiliateCode }: Props) {
  // View Role State: 'affiliate' (分销商视角) vs 'admin' (系统管理员视角)
  const [viewRole, setViewRole] = useState<'affiliate' | 'admin'>('affiliate');

  const [promoterCode, setPromoterCode] = useState(currentAffiliateCode || 'VIP888');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBundlingZip, setIsBundlingZip] = useState(false);
  
  // Login / Register Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [loginInputCode, setLoginInputCode] = useState('');
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWechat, setRegWechat] = useState('');
  const [regChannel, setRegChannel] = useState('微信朋友圈 / 微信群');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Navigation tabs for Affiliate View
  const [affiliateTab, setAffiliateTab] = useState<'overview' | 'download_package' | 'withdraw' | 'wholesale'>('overview');

  // Navigation tabs for Admin View
  const [adminTab, setAdminTab] = useState<'admin_grant' | 'withdraw_approval' | 'xunhupay' | 'integration'>('withdraw_approval');

  // Agent Commission Settings (Default 40% Tier-1)
  const [directRate, setDirectRate] = useState<number>(40);

  // Admin Granted Agents List
  const [agentsList, setAgentsList] = useState<Array<{ code: string; name: string; rate: number; phone: string; date: string }>>([
    { code: 'VIP888', name: '官方核心合伙人 (金牌代理)', rate: 40, phone: '138****8888', date: '2026-10-15' },
    { code: 'AGENT_ZHANG', name: '华东渠道老张 (一级合伙人)', rate: 40, phone: '139****9999', date: '2026-10-16' },
  ]);

  // Agent Applications Pending Admin Review
  const [applicationsList, setApplicationsList] = useState<AgentApplication[]>([
    {
      id: 'APP-20261017-01',
      name: '小林私域工作室',
      phone: '13766668888',
      wechat: 'lin_assistant',
      channel: '贴吧/小红书软件测评',
      status: 'pending',
      applyTime: '今天 11:20'
    }
  ]);

  const [newAgentCode, setNewAgentCode] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRate, setNewAgentRate] = useState(40);
  const [newAgentPhone, setNewAgentPhone] = useState('');

  // Affiliate Payout Receiving Account State
  const [payoutMethod, setPayoutMethod] = useState<'wechat' | 'alipay' | 'bank'>('wechat');
  const [accountName, setAccountName] = useState('张三');
  const [accountNo, setAccountNo] = useState('zhangsan@163.com');
  const [bankName, setBankName] = useState('招商银行杭州分行');
  const [accountSaved, setAccountSaved] = useState(false);

  // Withdrawal Requests Data Store
  const [withdrawalRecords, setWithdrawalRecords] = useState<WithdrawalRecord[]>([
    {
      id: 'WD-20261016-001',
      agentCode: 'VIP888',
      amount: 150.00,
      method: 'wechat',
      accountName: '官方核心合伙人',
      accountNo: '13888888888',
      status: 'completed',
      applyTime: '2026-10-16 14:20',
      payTime: '2026-10-16 14:25',
      txRef: 'WX20261016889912001',
      note: '商家转账到零钱已成功到账'
    },
    {
      id: 'WD-20261017-002',
      agentCode: 'AGENT_ZHANG',
      amount: 39.60,
      method: 'alipay',
      accountName: '老张数据工作室',
      accountNo: 'zhang@huadong.com',
      status: 'pending',
      applyTime: '今天 10:15',
      note: '等待管理员确认核对打款'
    }
  ]);

  // Withdrawal Input State
  const [withdrawAmountInput, setWithdrawAmountInput] = useState<string>('');
  const [withdrawNoteInput, setWithdrawNoteInput] = useState<string>('');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Admin Audit Input State
  const [adminTxRefInput, setAdminTxRefInput] = useState<{ [key: string]: string }>({});

  // XunhuPay (虎皮椒) Config Simulator
  const [xunhuAppId, setXunhuAppId] = useState('202610168899');
  const [xunhuAppSecret, setXunhuAppSecret] = useState('d3b07384d113edec49eaa6238ad5ff00');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  // Calculations for current active agent
  const affiliateOrders = orders.filter(
    o => o.referrerCode === promoterCode || (promoterCode === 'VIP888' && (o.referrerCode === 'DIRECT-OFFICIAL' || !o.referrerCode))
  );

  const totalCommissionEarned = affiliateOrders.reduce((sum, o) => {
    return sum + (o.commissionAmount || (o.amount * (directRate / 100)));
  }, 0);

  const completedWithdrawalsSum = withdrawalRecords
    .filter(w => w.agentCode === promoterCode && w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawalsSum = withdrawalRecords
    .filter(w => w.agentCode === promoterCode && w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const availableWithdrawBalance = Math.max(0, totalCommissionEarned - completedWithdrawalsSum - pendingWithdrawalsSum);

  const totalSales = affiliateOrders.reduce((sum, o) => sum + o.amount, 0);

  const referralUrl = `${window.location.origin}/?ref=${promoterCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Agent Login
  const handleAgentLogin = () => {
    const code = loginInputCode.trim().toUpperCase();
    if (!code) {
      alert('请输入您的代理代号或绑定手机号！');
      return;
    }
    const found = agentsList.find(a => a.code === code || a.phone === code);
    if (found) {
      setPromoterCode(found.code);
      onSetAffiliateCode(found.code);
      setShowLoginModal(false);
      alert(`登录成功！欢迎回来，${found.name}（代理代号: ${found.code}）`);
    } else {
      // Allow fast fallback login
      setPromoterCode(code);
      onSetAffiliateCode(code);
      setShowLoginModal(false);
      alert(`已以代理代号 [${code}] 极速登录成功！`);
    }
  };

  // Agent Registration
  const handleAgentRegister = () => {
    if (!regName.trim() || !regPhone.trim()) {
      alert('请填写团队/称呼及联系手机号！');
      return;
    }

    const newApp: AgentApplication = {
      id: `APP-${Date.now().toString().slice(-6)}`,
      name: regName,
      phone: regPhone,
      wechat: regWechat || '未提供',
      channel: regChannel,
      status: 'pending',
      applyTime: '刚刚'
    };

    setApplicationsList(prev => [newApp, ...prev]);
    setRegSuccessMsg(`分销商加入申请已提交成功！您的申请单号: ${newApp.id}。管理员审核通过后将通过短信发送您的专属代理代号。`);
  };

  // Approve Application
  const handleApproveApplication = (appId: string) => {
    const app = applicationsList.find(a => a.id === appId);
    if (!app) return;

    const generatedCode = `AGENT_${Math.floor(Math.random() * 899 + 100)}`;
    setAgentsList(prev => [
      ...prev,
      {
        code: generatedCode,
        name: app.name,
        rate: 40,
        phone: app.phone,
        date: new Date().toISOString().split('T')[0]
      }
    ]);

    setApplicationsList(prev => prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a));
    alert(`已审核通过 ${app.name} 的分销商申请！系统已为其生成专属代理代号: ${generatedCode}`);
  };

  // Submit a new withdrawal request
  const handleApplyWithdraw = () => {
    const amt = parseFloat(withdrawAmountInput);
    if (isNaN(amt) || amt <= 0) {
      alert('请输入有效的提现金额！');
      return;
    }
    if (amt > availableWithdrawBalance) {
      alert(`申请提现金额 (¥${amt.toFixed(2)}) 超过您的当前可提现余额 (¥${availableWithdrawBalance.toFixed(2)})！`);
      return;
    }
    if (amt < 1) {
      alert('单笔提现最低金额为 ¥1.00');
      return;
    }

    const newRecord: WithdrawalRecord = {
      id: `WD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 899 + 100)}`,
      agentCode: promoterCode,
      amount: amt,
      method: payoutMethod,
      accountName: accountName || '未填写真实姓名',
      accountNo: payoutMethod === 'bank' ? `${bankName} (${accountNo})` : accountNo,
      status: 'pending',
      applyTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      note: withdrawNoteInput || '代理自主提交提现申请'
    };

    setWithdrawalRecords(prev => [newRecord, ...prev]);
    setWithdrawAmountInput('');
    setWithdrawNoteInput('');
    setSubmitMsg(`提现申请提交成功！申请单号: ${newRecord.id}，提现金额: ¥${amt.toFixed(2)}。管理员将在24小时内审核并打款到您的收款账户。`);
    setTimeout(() => setSubmitMsg(null), 8000);
  };

  // Admin actions
  const handleApproveWithdraw = (recordId: string) => {
    const txRef = adminTxRefInput[recordId] || `TRANS-${Math.floor(Math.random() * 899999 + 100000)}`;
    setWithdrawalRecords(prev => prev.map(w => {
      if (w.id === recordId) {
        return {
          ...w,
          status: 'completed',
          payTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          txRef: txRef,
          note: '管理员已人工核对并转账完成'
        };
      }
      return w;
    }));
    alert(`提现申请 ${recordId} 已成功标记为【已打款到账】！交易凭证号: ${txRef}`);
  };

  const handleRejectWithdraw = (recordId: string) => {
    const reason = prompt('请输入驳回原因:', '收款账号信息不有误/无法转账');
    if (reason === null) return;
    setWithdrawalRecords(prev => prev.map(w => {
      if (w.id === recordId) {
        return {
          ...w,
          status: 'rejected',
          note: `驳回原因: ${reason}`
        };
      }
      return w;
    }));
  };

  // Agent-branded ZIP packager
  const handleDownloadAgentZip = async () => {
    setIsBundlingZip(true);
    try {
      const zip = new JSZip();

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

      zip.file(
        `一键运行助手[分销商-${promoterCode}专属版].bat`,
        `@echo off
chcp 65001 >nul
title 微信群及好友数据导出助手 - 分销商[${promoterCode}]专属版
echo ========================================================
echo   微信群及好友数据导出助手 (分销商专属分发版)
echo   渠道代号: ${promoterCode} (享官方 ${directRate}% 专属分润)
echo   云端授权节点: https://api.thinkai.vip
echo ========================================================
echo 正在启动客户端并注入渠道分成标记...
timeout /t 1 >nul
if exist "ThinkAI_Assistant.exe" (
    start "" "ThinkAI_Assistant.exe" --channel=${promoterCode}
) else (
    echo [提示] 绿色客户端启动环境已就绪。
    echo 客户端已永久绑定分销商代号 [${promoterCode}]，所有购买激活均计入您的收益！
    pause
)
exit
`
      );

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

  const handleSimulateWebhook = () => {
    setSimulatingWebhook(true);
    setWebhookStatus(null);
    setTimeout(() => {
      setWebhookStatus('【原子事务执行成功】接收虎皮椒 Webhook 回调 ──> 校验 MD5 签名通过 ──> 单一 SQL 事务同时写入：① 订单 ORD-SIM-' + Math.floor(Math.random() * 89999 + 10000) + ' 标记已付；② 动态生成 RSA-2048 卡密 VIP-2026-YEAR-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '；③ 给分销商(' + promoterCode + ')记账 40% 分润 ¥' + (99 * directRate / 100).toFixed(2) + '；④ 平台留存 ¥' + (99 * (100 - directRate) / 100).toFixed(2) + '。零掉单保证！');
      setSimulatingWebhook(false);
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
      {/* ROLE VIEW MODE TOGGLE BANNER */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${viewRole === 'affiliate' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
            {viewRole === 'affiliate' ? <UserCheck className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                当前视角：{viewRole === 'affiliate' ? '【分销商 / 代理商独立工作台】' : '【系统超级管理员中控】'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${viewRole === 'affiliate' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                {viewRole === 'affiliate' ? '分销商登录后界面' : '超级管理员界面'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {viewRole === 'affiliate' 
                ? '已隐藏系统服务器配置与管理控制面板，代理商仅可操作自己的推广与提现。' 
                : '包含全局分销商审核、佣金比例配置、提现申请审核打款中控。'}
            </p>
          </div>
        </div>

        {/* View Switcher & Login Entrance Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setModalMode('login');
              setShowLoginModal(true);
            }}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>代理商登录 / 申请注册</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewRole('affiliate')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewRole === 'affiliate' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              分销商视角
            </button>
            <button
              onClick={() => setViewRole('admin')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewRole === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              超级管理员视角
            </button>
          </div>
        </div>
      </div>

      {/* HEADER SECTION FOR AFFILIATE VIEW */}
      {viewRole === 'affiliate' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <GitFork className="w-4 h-4 text-emerald-500" />
                <span>分销商专属独立工作台 · 零门槛推广变现</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                官方合作分销商后台
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                查看您的专属链接、实时出单流水、下载带有您代号的专属软件包，并随时提现佣金收益
              </p>
            </div>

            {/* Agent Code Switcher */}
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 font-medium">当前登录代理代号：</span>
              <input
                type="text"
                value={promoterCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setPromoterCode(code);
                  onSetAffiliateCode(code);
                }}
                className="w-28 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* AFFILIATE TABS */}
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 sm:gap-4">
            <button
              onClick={() => setAffiliateTab('overview')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                affiliateTab === 'overview'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 业绩概览与出单流水</span>
            </button>

            <button
              onClick={() => setAffiliateTab('download_package')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                affiliateTab === 'download_package'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>📦 专属软件分发包 & 推广链接</span>
            </button>

            <button
              onClick={() => setAffiliateTab('withdraw')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                affiliateTab === 'withdraw'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>💰 佣金提现管理与打款记录</span>
            </button>

            <button
              onClick={() => setAffiliateTab('wholesale')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                affiliateTab === 'wholesale'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>🏷️ 6折批量拿货底价通道</span>
            </button>
          </div>

          {/* AFFILIATE TAB 1: OVERVIEW */}
          {affiliateTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block mb-1">渠道推广总出单</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    {affiliateOrders.length} <span className="text-xs font-normal text-slate-400">单</span>
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block mb-1">促成成交流水</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    ¥{totalSales.toFixed(2)}
                  </span>
                </div>

                <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block mb-1">分润分成比例</span>
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {directRate}%
                  </span>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">当前可提现佣金余额</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    ¥{availableWithdrawBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Share Link Banner */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Link className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      您的专属商城推广链接 (客户点击即自动绑定您的代理代号):
                    </div>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-md">
                      {referralUrl}
                    </div>
                  </div>
                </div>

                <button
                  onClick={copyLink}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '链接已复制' : '复制专属推广链接'}</span>
                </button>
              </div>

              {/* Order Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  专属客户出单明细流水 ({directRate}% 分润记账)
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
                          <th className="p-3">分销商分成 ({directRate}%)</th>
                          <th className="p-3">激活卡密</th>
                          <th className="p-3">成交时间</th>
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

          {/* AFFILIATE TAB 2: DOWNLOAD PACKAGE */}
          {affiliateTab === 'download_package' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>分销商专属绿色免安装软件分发包</span>
                  </div>
                  <h3 className="text-lg font-bold">
                    一键打包生成内置您代号 ({promoterCode}) 的安装包 (.zip)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    包内包含一键启动程序与隐藏配置文件 <code className="text-emerald-400 font-mono">channel_config.json</code>。把这个压缩包直接发给客户或挂在您的网盘，客户解压后购买激活，收益全部自动计入您的账号！
                  </p>
                </div>

                <button
                  onClick={handleDownloadAgentZip}
                  disabled={isBundlingZip}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isBundlingZip ? '正在打包中...' : `下载 [${promoterCode}] 专属软件包`}</span>
                </button>
              </div>
            </div>
          )}

          {/* AFFILIATE TAB 3: WITHDRAWAL MANAGEMENT */}
          {affiliateTab === 'withdraw' && (
            <div className="space-y-6">
              {/* Balances Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">累计获得分润总额</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    ¥{totalCommissionEarned.toFixed(2)}
                  </span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-1">当前可提现余额</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    ¥{availableWithdrawBalance.toFixed(2)}
                  </span>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1">审核打款中余额</span>
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
                    ¥{pendingWithdrawalsSum.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">已成功到账总额</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                    ¥{completedWithdrawalsSum.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form: Payout Account Binding & Submit Withdrawal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Binding */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>步骤 1：设置您的收款提现账号</span>
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">提现打款方式</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('wechat')}
                          className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                            payoutMethod === 'wechat' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>微信零钱</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('alipay')}
                          className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                            payoutMethod === 'alipay' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>支付宝</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayoutMethod('bank')}
                          className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                            payoutMethod === 'bank' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>银行卡</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">收款人真实姓名</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="例如: 张三"
                        className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        {payoutMethod === 'wechat' ? '微信绑定手机号 / 微信号' : payoutMethod === 'alipay' ? '支付宝账号 (手机或邮箱)' : '银行卡卡号'}
                      </label>
                      <input
                        type="text"
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                        placeholder={payoutMethod === 'bank' ? '6222 0000 0000 0000' : '13800000000'}
                        className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Withdrawal Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-600" />
                      <span>步骤 2：发起佣金提现申请</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold">提现金额 (元)</label>
                          <button
                            type="button"
                            onClick={() => setWithdrawAmountInput(availableWithdrawBalance.toFixed(2))}
                            className="text-[11px] text-emerald-600 hover:underline font-bold"
                          >
                            全部提现 (¥{availableWithdrawBalance.toFixed(2)})
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">¥</span>
                          <input
                            type="number"
                            step="0.01"
                            value={withdrawAmountInput}
                            onChange={(e) => setWithdrawAmountInput(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 border rounded-lg font-mono font-bold text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyWithdraw}
                    disabled={availableWithdrawBalance <= 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50 mt-4"
                  >
                    提交提现申请 (起提金额 ¥1.00)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AFFILIATE TAB 4: WHOLESALE */}
          {affiliateTab === 'wholesale' && (
            <div className="space-y-6">
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
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {/* ADMIN VIEW MODE */}
      {viewRole === 'admin' && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>系统超级管理员视角 · 内部数据与打款审核控制中心</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                全站分销商管理与提现打款中控
              </h2>
            </div>
          </div>

          {/* ADMIN TABS */}
          <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 sm:gap-4">
            <button
              onClick={() => setAdminTab('withdraw_approval')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'withdraw_approval'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>🏛️ 分销商提现审核与打款中控 ({withdrawalRecords.filter(w=>w.status==='pending').length}笔待审核)</span>
            </button>

            <button
              onClick={() => setAdminTab('admin_grant')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'admin_grant'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 分销商合伙人名册与申请审核 ({applicationsList.filter(a=>a.status==='pending').length}人申请)</span>
            </button>

            <button
              onClick={() => setAdminTab('xunhupay')}
              className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                adminTab === 'xunhupay'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>⚡ 虎皮椒免执照通道 & 原子事务</span>
            </button>
          </div>

          {/* ADMIN TAB 1: WITHDRAWAL APPROVAL */}
          {adminTab === 'withdraw_approval' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  待处理提现申请列表 ({withdrawalRecords.filter(w => w.status === 'pending').length} 笔)
                </h5>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">提现单号</th>
                        <th className="p-3">申请分销商</th>
                        <th className="p-3">提现金额</th>
                        <th className="p-3">收款渠道</th>
                        <th className="p-3">收款姓名 / 账号</th>
                        <th className="p-3">申请时间</th>
                        <th className="p-3">转账交易凭证号</th>
                        <th className="p-3 text-right">审核操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {withdrawalRecords.filter(w => w.status === 'pending').map((w) => (
                        <tr key={w.id} className="hover:bg-purple-50/20 dark:hover:bg-purple-950/20">
                          <td className="p-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{w.id}</td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{w.agentCode}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            ¥{w.amount.toFixed(2)}
                          </td>
                          <td className="p-3 font-semibold uppercase">{w.method}</td>
                          <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {w.accountName} <span className="text-slate-400 text-[11px]">({w.accountNo})</span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400">{w.applyTime}</td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="如: WX20261017..."
                              value={adminTxRefInput[w.id] || ''}
                              onChange={(e) => setAdminTxRefInput({ ...adminTxRefInput, [w.id]: e.target.value })}
                              className="px-2 py-1 border rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 font-mono text-[11px] w-36"
                            />
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleApproveWithdraw(w.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer text-xs"
                            >
                              确认已打款
                            </button>
                            <button
                              onClick={() => handleRejectWithdraw(w.id)}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer text-xs"
                            >
                              驳回
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

          {/* ADMIN TAB 2: AGENT REGISTRATION APPLICATIONS & AGENTS LIST */}
          {adminTab === 'admin_grant' && (
            <div className="space-y-6">
              {/* Pending Registration Applications */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>📩 待审核的线上分销商加盟申请 ({applicationsList.filter(a => a.status === 'pending').length} 人)</span>
                </h5>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-medium border-b border-purple-200 dark:border-purple-800">
                      <tr>
                        <th className="p-3">申请单号</th>
                        <th className="p-3">团队 / 申请人</th>
                        <th className="p-3">联系手机</th>
                        <th className="p-3">微信号</th>
                        <th className="p-3">拟推广渠道</th>
                        <th className="p-3">申请时间</th>
                        <th className="p-3 text-right">审核开通</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {applicationsList.filter(a => a.status === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            暂无待审核的代理加盟申请
                          </td>
                        </tr>
                      ) : (
                        applicationsList.filter(a => a.status === 'pending').map((app) => (
                          <tr key={app.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/30">
                            <td className="p-3 font-mono text-purple-600 font-bold">{app.id}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{app.name}</td>
                            <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{app.phone}</td>
                            <td className="p-3 font-mono text-slate-600">{app.wechat}</td>
                            <td className="p-3 text-slate-600">{app.channel}</td>
                            <td className="p-3 text-slate-400 font-mono text-[11px]">{app.applyTime}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleApproveApplication(app.id)}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                              >
                                通过并授予代理代号
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Authorized Agents List */}
              <div className="space-y-3 pt-4">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  已开通代理名册 ({agentsList.length} 位)
                </h5>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">代理代号</th>
                        <th className="p-3">合伙人称呼</th>
                        <th className="p-3">联系方式</th>
                        <th className="p-3">分润比例</th>
                        <th className="p-3">开通日期</th>
                        <th className="p-3">专属推广链接</th>
                        <th className="p-3 text-right">模拟登录</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agentsList.map((agent) => (
                        <tr key={agent.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{agent.code}</td>
                          <td className="p-3 font-medium text-slate-900 dark:text-white">{agent.name}</td>
                          <td className="p-3 font-mono text-slate-500">{agent.phone}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{agent.rate}%</td>
                          <td className="p-3 text-slate-400">{agent.date}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                            {window.location.origin}/?ref={agent.code}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setPromoterCode(agent.code);
                                onSetAffiliateCode(agent.code);
                                setViewRole('affiliate');
                                setAffiliateTab('overview');
                              }}
                              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                            >
                              以该代理身份看后台
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

          {/* ADMIN TAB 3: XUNHUPAY */}
          {adminTab === 'xunhupay' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-5 space-y-2">
                <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>虎皮椒个人免执照正规通道与「发卡即授权」零丢单事务</span>
                </h4>
              </div>
            </div>
          )}
        </>
      )}

      {/* LOGIN & REGISTER DIALOG MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    代理商专属服务门户
                  </h3>
                  <p className="text-xs text-slate-500">登录代理后台或在线申请成为合作分销商</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setModalMode('login')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalMode === 'login' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>代理商快捷登录</span>
              </button>
              <button
                onClick={() => setModalMode('register')}
                className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalMode === 'register' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>申请加盟成为分销商</span>
              </button>
            </div>

            {/* MODE 1: AGENT QUICK LOGIN */}
            {modalMode === 'login' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    请输入您的代理代号 / 绑定手机号：
                  </label>
                  <input
                    type="text"
                    placeholder="例如: VIP888 或 AGENT_ZHANG"
                    value={loginInputCode}
                    onChange={(e) => setLoginInputCode(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl font-mono text-sm uppercase bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    默认演示代号：<code className="text-emerald-600 font-mono font-bold cursor-pointer" onClick={() => setLoginInputCode('VIP888')}>VIP888</code> 或 <code className="text-emerald-600 font-mono font-bold cursor-pointer" onClick={() => setLoginInputCode('AGENT_ZHANG')}>AGENT_ZHANG</code>
                  </span>
                </div>

                <button
                  onClick={handleAgentLogin}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  验证并进入代理独立后台
                </button>
              </div>
            )}

            {/* MODE 2: SELF REGISTRATION */}
            {modalMode === 'register' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">团队 / 个人称呼</label>
                  <input
                    type="text"
                    placeholder="例如: 杭州渠道工作室老李"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">联系手机号</label>
                  <input
                    type="text"
                    placeholder="13800000000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">微信号 (用于拉入代理售后群)</label>
                  <input
                    type="text"
                    placeholder="wx_123456"
                    value={regWechat}
                    onChange={(e) => setRegWechat(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">拟推广主战场</label>
                  <select
                    value={regChannel}
                    onChange={(e) => setRegChannel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700"
                  >
                    <option value="微信朋友圈 / 微信群">微信朋友圈 / 微信私域群</option>
                    <option value="贴吧 / 小红书 / 抖音引流">贴吧 / 小红书 / 抖音短视频引流</option>
                    <option value="闲鱼 / 淘宝电商上架">闲鱼 / 淘宝电商网店上架</option>
                    <option value="百度网盘 / 软件站下载">百度网盘 / 软件下载站挂载</option>
                  </select>
                </div>

                {regSuccessMsg ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">
                    {regSuccessMsg}
                  </div>
                ) : (
                  <button
                    onClick={handleAgentRegister}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-md mt-2"
                  >
                    提交加盟申请 (官方 40% 分润)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
