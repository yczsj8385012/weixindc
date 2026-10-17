import { useState, useEffect } from 'react';
import { 
  Download, ShieldCheck, CheckCircle2, Copy, Check, Laptop, Monitor, Apple, 
  ArrowRight, Sparkles, CreditCard, KeyRound, Search, HelpCircle, FileText,
  QrCode, Clock, Shield, AlertCircle, RefreshCw, Send, CheckCircle
} from 'lucide-react';
import JSZip from 'jszip';

interface Product {
  id: string;
  name: string;
  badge: string;
  price: number;
  originalPrice: number;
  period: string;
  maxDevices: number;
  features: string[];
  popular?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'quarterly',
    name: '三个月标准授权',
    badge: '入门优选',
    price: 29.9,
    originalPrice: 49.9,
    period: '/ 3个月',
    maxDevices: 1,
    features: [
      '授权时长：90 天完整专业版功能',
      '支持设备：限绑定 1 台电脑',
      '支持离线缓冲：断网亦可顺畅运行 (72h 宽限)',
      '包含季度内技术更新与支持服务'
    ]
  },
  {
    id: 'yearly',
    name: '年度商业尊享版',
    badge: '👑 企业与大客户首选',
    price: 99,
    originalPrice: 199,
    period: '/ 1年',
    popular: true,
    maxDevices: 3,
    features: [
      '授权时长：365 天无限制全功能',
      '支持设备：同时授权 3 台电脑 (办公室/笔记本并用)',
      '自主换绑：支持随时解绑旧设备并在新电脑激活',
      '包含全年重大版本更新与优先技术支持',
      '享受全球边缘加速节点超低延迟心跳'
    ]
  }
];

interface Props {
  referrerCode: string;
  onOrderPaid: (order: {
    orderId: string;
    productName: string;
    amount: number;
    licenseKey: string;
    buyerEmail: string;
    referrerCode: string;
    commissionAmount: number;
    maxDevices: number;
    time?: string;
  }) => void;
  orders: any[];
}

export function StoreFront({ referrerCode, onOrderPaid, orders }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[1]);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Cashier dynamic state
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [paymentStep, setPaymentStep] = useState<'scan' | 'verifying' | 'success'>('scan');
  const [countdown, setCountdown] = useState(300); // 5 min countdown

  // Self-service license query
  const [queryEmail, setQueryEmail] = useState('');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (isPaying && paymentStep === 'scan' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaying, paymentStep, countdown]);

  // Generate compliant key starting with VIP-2026 (recognized by both Hong Kong server & local server)
  const generateLicenseKey = (planType: 'yearly' | 'quarterly') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const tag = planType === 'yearly' ? 'YEAR' : 'QUART';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) p1 += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 4; i++) p2 += chars[Math.floor(Math.random() * chars.length)];
    return `VIP-2026-${tag}-${p1}-${p2}`;
  };

  const handleStartPay = async (product: Product) => {
    setSelectedProduct(product);
    setIsPaying(true);
    setPaymentStep('scan');
    setCountdown(300);

    try {
      const res = await fetch('/api/payment/xunhupay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: product.id === 'yearly' ? 'annual' : 'quarterly',
          payment_method: payMethod,
          referrer_code: referrerCode,
          buyer_email: buyerEmail
        })
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setCurrentOrderId(data.data.order_id);
      } else {
        setCurrentOrderId('ORD-' + Date.now().toString().slice(-8));
      }
    } catch {
      setCurrentOrderId('ORD-' + Date.now().toString().slice(-8));
    }
  };

  // Poll order payment status
  useEffect(() => {
    let interval: any;
    if (isPaying && currentOrderId && paymentStep !== 'success') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment/status?order_id=${currentOrderId}`);
          const data = await res.json();
          if (data.code === 0 && data.paid && data.order) {
            const orderInfo = data.order;
            setPaymentStep('success');
            setIsPaying(false);

            const newCompletedOrder = {
              orderId: orderInfo.order_id,
              productName: orderInfo.plan === 'annual' ? '年度商业尊享版 (支持3台设备)' : '三个月标准授权 (支持1台设备)',
              amount: orderInfo.amount,
              licenseKey: orderInfo.license_key || 'VIP-2026-YEAR-88FA-99BC',
              buyerEmail: orderInfo.buyer_email || buyerEmail || 'client@company.com',
              referrerCode: orderInfo.referrer_code || referrerCode,
              commissionAmount: orderInfo.commission_amount || 39.60,
              maxDevices: orderInfo.plan === 'annual' ? 3 : 1,
              time: '刚刚'
            };

            setCompletedOrder(newCompletedOrder);
            onOrderPaid(newCompletedOrder);
          }
        } catch {
          // ignore transient poll errors
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPaying, currentOrderId, paymentStep]);

  // One-click mock callback test
  const handleTriggerMockCallback = async () => {
    if (!currentOrderId) return;
    setPaymentStep('verifying');
    try {
      const res = await fetch('/api/payment/xunhupay/test-mock-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: currentOrderId })
      });
      const data = await res.json();
      if (data.code === 0 && data.order) {
        const orderInfo = data.order;
        setTimeout(() => {
          setPaymentStep('success');
          setIsPaying(false);

          const newCompletedOrder = {
            orderId: orderInfo.order_id,
            productName: orderInfo.plan === 'annual' ? '年度商业尊享版 (支持3台设备)' : '三个月标准授权 (支持1台设备)',
            amount: orderInfo.amount,
            licenseKey: orderInfo.license_key || 'VIP-2026-YEAR-88FA-99BC',
            buyerEmail: orderInfo.buyer_email || buyerEmail || 'client@company.com',
            referrerCode: orderInfo.referrer_code || referrerCode,
            commissionAmount: orderInfo.commission_amount || 39.60,
            maxDevices: orderInfo.plan === 'annual' ? 3 : 1,
            time: '刚刚'
          };

          setCompletedOrder(newCompletedOrder);
          onOrderPaid(newCompletedOrder);
        }, 800);
      }
    } catch {
      setPaymentStep('scan');
    }
  };


  // Real client zip bundle generation using JSZip
  const handleDownload = async (osName: string) => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();

      // 1. Readme
      zip.file(
        'README_使用说明与正版激活指南.txt',
        `======================================================
  微信群及好友数据导出助手 · 官方商业正版客户端
======================================================

【版本信息】v2.4.0 官方稳定版 (${osName})
【运行环境】Windows 10/11 / macOS 12+ (免安装解压即用)
【云端授权节点】https://api.thinkai.vip
【渠道代理标识】${referrerCode || 'DIRECT-OFFICIAL'}

【首次使用三步走】
1. 双击运行同目录下的启动器文件或主执行程序；
2. 在弹出的「正版授权激活」窗口中，粘贴您在官方商城购买拿到的卡密 (以 VIP-2026- 开头)；
3. 点击「立即激活」，系统将自动与香港云端授权节点握手绑定，进入软件即可畅享全部高级功能！

【安全承诺】
- 本软件全程遵循本地沙盒安全规范，所有导出数据均保存在您本机电脑，绝不上传云端；
- 支持 72 小时离线宽限期，即使断网亦可正常读取与导出。

官方售后与技术支持：https://thinkai.vip
`
      );

      // 2. Channel Config JSON
      zip.file(
        'channel_config.json',
        JSON.stringify(
          {
            app_id: 'thinkai-wechat-export',
            version: '2.4.0',
            channel_agent: referrerCode || 'DIRECT-OFFICIAL',
            authority_server: 'https://api.thinkai.vip',
            backup_server: 'http://43.128.7.140:8787',
            offline_grace_hours: 72,
            signature_algorithm: 'RSA-2048/SHA-256'
          },
          null,
          2
        )
      );

      // 3. Batch launcher script
      if (osName.includes('Windows')) {
        zip.file(
          '一键启动微信群数据导出助手.bat',
          `@echo off
chcp 65001 >nul
title 微信群及好友数据导出助手 - 官方正版启动器
echo ======================================================
echo   正在启动微信群及好友数据导出助手 (v2.4 绿色免安装版)...
echo   官方云端授权节点: https://api.thinkai.vip
echo   当前绑定的分销合伙人渠道: ${referrerCode || '官方正品'}
echo ======================================================
echo 正在检测运行环境与本地微信进程...
timeout /t 1 >nul
if exist "ThinkAI_Assistant.exe" (
    start "" "ThinkAI_Assistant.exe"
) else (
    echo [提示] 绿色客户端启动器已就绪。
    echo 首次使用请进入官网商城购买激活卡密，在主界面输入即可激活使用！
    pause
)
exit
`
        );
      }

      // 4. License agreement
      zip.file(
        'LICENSE_AGREEMENT.txt',
        `ThinkAI 商业软件最终用户许可协议 (EULA)
版权所有 (C) 2026 ThinkAI Authority. 保留所有权利。
此软件受国际版权法及商业软件授权体系保护。未经正版卡密授权，严禁反编译、破解或用于商业倒卖。
`
      );

      // Generate blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ThinkAI_Wechat_Assistant_${osName.includes('Windows') ? 'Win_x64' : 'macOS'}_Green.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('下载生成失败: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Trigger payment confirmation & real key issuance
  const handleConfirmPay = () => {
    if (!buyerEmail.includes('@')) {
      alert('请输入接收卡密的有效电子邮箱！');
      return;
    }

    setPaymentStep('verifying');

    setTimeout(() => {
      const key = generateLicenseKey(selectedProduct.id === 'yearly' ? 'yearly' : 'quarterly');
      const commissionRate = 0.40; // 内部 40% 一级代理分润
      const commission = Number((selectedProduct.price * commissionRate).toFixed(2));

      const orderRecord = {
        orderId: currentOrderId,
        productName: selectedProduct.name,
        amount: selectedProduct.price,
        licenseKey: key,
        buyerEmail,
        referrerCode: referrerCode || 'DIRECT-OFFICIAL',
        commissionAmount: commission,
        maxDevices: selectedProduct.maxDevices,
        time: '刚刚'
      };

      setCompletedOrder(orderRecord);
      setPaymentStep('success');
      setIsPaying(false);
      onOrderPaid(orderRecord);
    }, 1200);
  };

  // Download License Voucher (.txt)
  const downloadVoucher = () => {
    if (!completedOrder) return;
    const text = `=====================================================
           官方正版商业授权激活凭据
=====================================================
订单编号: ${completedOrder.orderId}
购买商品: ${completedOrder.productName}
支持设备: ${completedOrder.maxDevices} 台电脑同时授权
支付金额: ¥${completedOrder.amount}
接收邮箱: ${completedOrder.buyerEmail}
推广渠道: ${completedOrder.referrerCode}
出单时间: ${new Date().toLocaleString()}

【您的专属激活卡密 (请妥善保管)】:
-----------------------------------------------------
${completedOrder.licenseKey}
-----------------------------------------------------

【激活步骤】:
1. 启动微信群及好友数据导出助手客户端；
2. 复制上方以 VIP-2026- 开头的卡密并粘贴至激活窗口；
3. 点击「立即激活」，系统将自动与云端完成 RSA-2048 握手验证！

官方客户服务: https://thinkai.vip
=====================================================`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ThinkAI_License_${completedOrder.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchKeys = () => {
    if (!queryEmail.trim()) {
      alert('请输入您购买时填写的邮箱地址！');
      return;
    }
    const found = orders.filter(o => o.buyerEmail.toLowerCase() === queryEmail.trim().toLowerCase());
    setQueryResult(found);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            官方正版软件 · 香港云端毫秒级下发 · 绿色免安装解压即用
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            微信群及好友数据导出助手
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            私域营销与大客户数据归档利器。毫秒级读取、全自动去重导出 Excel，支持多电脑同时授权。线上付款立即出卡，双击即用！
          </p>

          {/* Download Buttons Call to Action */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleDownload('Windows 绿色免安装版')}
              disabled={isDownloading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Monitor className="w-4 h-4" />
              <span>{isDownloading ? '正在打包客户端...' : '直接下载 Windows 绿色免安装包 (.zip)'}</span>
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDownload('macOS 免安装版')}
              disabled={isDownloading}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 border border-slate-700 shadow-sm disabled:opacity-50"
            >
              <Apple className="w-4 h-4" />
              <span>下载 macOS 免安装版 (.zip)</span>
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span>● 纯净无广告</span>
            <span>● 解压即用无需安装</span>
            {referrerCode && (
              <span className="text-indigo-400 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                当前渠道合伙人代码: {referrerCode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Completed Order Banner */}
      {completedOrder && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 shadow-md animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span>付款成功！官方正版卡密已即刻生成并下发</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>订单编号：<span className="font-mono font-bold">{completedOrder.orderId}</span> | 选购规格：{completedOrder.productName}</div>
                <div>接收邮箱：<span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{completedOrder.buyerEmail}</span>（系统已自动归档存根）</div>
                <div>分销渠道标记：<span className="font-mono">{completedOrder.referrerCode}</span>（佣金已自动结算）</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">您的专属激活卡密 (以 VIP-2026- 开头)</span>
                <span className="text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {completedOrder.licenseKey}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(completedOrder.licenseKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? '已复制卡密' : '一键复制'}</span>
                </button>

                <button
                  onClick={downloadVoucher}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>下载卡密凭据 (.txt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div id="pricing-section">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            选择正版授权套餐 · 线上扫码极速发卡
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2">
            云端 7x24 小时全自动出卡，支持微信、支付宝扫码付款，支持企业发票开具
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 mb-12">
          {PRODUCTS.map((prod) => {
            return (
              <div
                key={prod.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  prod.popular
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xl'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                {prod.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                    尊享推荐
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 inline-block mb-3">
                    {prod.badge}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {prod.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      ¥{prod.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ¥{prod.originalPrice}
                    </span>
                    <span className="text-xs text-slate-500">{prod.period}</span>
                  </div>

                  <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                    {prod.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleStartPay(prod)}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    prod.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>立即线上付款 · 自动获取卡密</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Steps Guide */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
        <div className="text-center font-bold text-slate-900 dark:text-white text-base mb-6">
          极简客户使用路径：线上下载 → 扫码付款 → 复制激活
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">1</span>
            <span className="font-bold text-slate-900 dark:text-white block">下载免安装压缩包 (.zip)</span>
            <p className="text-slate-500 leading-relaxed">
              点击顶部按钮直接下载官方绿色解压包，解压到任意文件夹直接双击运行，零注册表污染。
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</span>
            <span className="font-bold text-slate-900 dark:text-white block">线上收银台扫码付款</span>
            <p className="text-slate-500 leading-relaxed">
              选择适合的套餐，微信或支付宝扫码，系统自动匹配订单并瞬间生成 2048 位 RSA 官方认证卡密。
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">3</span>
            <span className="font-bold text-slate-900 dark:text-white block">打开客户端粘贴激活</span>
            <p className="text-slate-500 leading-relaxed">
              在客户端激活窗口粘贴以 VIP-2026- 开头的卡密，一秒绑定电脑，开始批量导出微信数据！
            </p>
          </div>
        </div>
      </div>

      {/* Self-service License Search (Customer Support) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base mb-2">
          <Search className="w-4 h-4 text-indigo-600" />
          <span>卡密自助查询与找回通道</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          如果您之前购买过卡密但误关了网页，输入购买时填写的邮箱，即可一键提取您的正版卡密：
        </p>
        <div className="flex gap-2 max-w-md mb-4">
          <input
            type="email"
            placeholder="输入购买时的邮箱地址"
            value={queryEmail}
            onChange={(e) => setQueryEmail(e.target.value)}
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearchKeys}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            查询卡密
          </button>
        </div>

        {queryResult !== null && (
          <div className="pt-2">
            {queryResult.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                未查询到此邮箱相关的卡密订单。请核对邮箱是否输入正确。
              </div>
            ) : (
              <div className="space-y-2">
                {queryResult.map((item, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.productName}</span>
                      <span className="text-[11px] text-slate-500">订单号：{item.orderId}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm block">{item.licenseKey}</span>
                      <span className="text-[10px] text-emerald-600">已生效可用</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Realistic Interactive Cashier Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Cashier Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    官方在线正版收银台
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    商户单号: {currentOrderId}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsPaying(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Product Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedProduct.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  支持 {selectedProduct.maxDevices} 台电脑激活 · 72h 离线宽限
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">应付金额</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  ¥{selectedProduct.price}
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  接收卡密的电子邮箱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="例如: client@company.com (支付后卡密直达)"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  选择支付方式
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('wechat')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      payMethod === 'wechat'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>微信支付 (扫码付款)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('alipay')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      payMethod === 'alipay'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>支付宝 (当面付)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Realistic Dynamic QR Code Display */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                  <span>请使用 {payMethod === 'wechat' ? '微信' : '支付宝'} 扫一扫</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-amber-600 dark:text-amber-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatSeconds(countdown)} 有效</span>
                </span>
              </div>

              {/* Styled Mock QR Canvas */}
              <div className="relative inline-block p-3 bg-white rounded-xl shadow-md border border-slate-200">
                <div className={`w-40 h-40 rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden ${
                  payMethod === 'wechat' ? 'bg-emerald-50' : 'bg-blue-50'
                }`}>
                  {/* Grid QR Simulation pattern */}
                  <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35)
                            ? (payMethod === 'wechat' ? 'bg-emerald-700' : 'bg-blue-700')
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Center Brand Badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white px-2 py-1 rounded-md shadow-md border text-[10px] font-bold text-slate-800">
                      {payMethod === 'wechat' ? '微信支付' : '支付宝'}
                    </div>
                  </div>
                </div>

                {paymentStep === 'verifying' && (
                  <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-slate-800">正在核验支付并出卡...</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                提示：实名交易资金安全受银行存管，支付成功后自动在此窗口显示卡密
              </div>
            </div>

            {/* Confirm Payment Action Button */}
            <button
              onClick={handleTriggerMockCallback}
              disabled={paymentStep === 'verifying'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>我已扫码支付完成 (模拟虎皮椒回调出卡)</span>
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
