import { PAYMENT_METHODS } from '../data/solutionsData';
import { CreditCard, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, DollarSign, Wallet } from 'lucide-react';

export function PaymentStrategyGuide() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              微信 & 支付宝收款终极解决方案指南
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            破解“Dujiao-Next 需商户参数，无法直接收款”的痛点：个人免执照 vs 个体户官方直连全解析
          </p>
        </div>
      </div>

      {/* Warning Box on Unofficial methods */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">避坑警示：严禁使用“个人挂机监听免签（如V免签、安卓手机挂微信监听通知）”！</strong>
          <br />
          微信和支付宝近两年对个人频繁转账进行严密风控，挂机软件极易触发“涉嫌电信诈骗/异常流水”导致个人微信账号被永久冻结，并导致买家无法付款。
          正规软件销售必须通过合规接口接入。
        </div>
      </div>

      {/* Payment Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {PAYMENT_METHODS.map((method, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-5 flex flex-col justify-between ${
              method.recommended
                ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {method.name}
                </span>
                {method.recommended && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-white shrink-0">
                    推荐路径
                  </span>
                )}
              </div>

              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-3">
                适合：{method.targetAudience}
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-b border-slate-100 dark:border-slate-800/80 py-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">所需资质：</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{method.qualification}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">交易手续费：</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{method.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">稳定性与合规：</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{method.stability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">资金到账周期：</span>
                  <span className="text-slate-800 dark:text-slate-200">{method.settlement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">开通/办理成本：</span>
                  <span className="text-slate-800 dark:text-slate-200">{method.setupCost}</span>
                </div>
              </div>

              <div className="space-y-1 mb-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">特点与优势：</div>
                {method.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Practical Action Steps */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-500" />
          两套推荐实施路径指南：
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
              路线 A：最快 1 小时上线（个人无执照）
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              1. 注册<strong>虎皮椒 (Xunhupay)</strong> 或类似正规代收平台，完成个人身份证实名认证。<br />
              2. 获得 AppID 与 AppSecret，在 Cloudflare Worker 或发卡系统中配置支付回调 Webhook。<br />
              3. 用户微信扫码或支付宝付款后，平台触发异步通知，Worker 接收验签后自动发卡并记账分销。
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              路线 B：永久合规运营（办理个体户执照）
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              1. 网上找财务代办办理“软件开发/技术服务”类个体工商户营业执照（约 ¥300，无需租办公室）。<br />
              2. 直接向<strong>微信支付官方申请商户号</strong>并认证，费率享 0.6% 官方最低优惠。<br />
              3. 支付宝申请“当面付/手机网站支付”。支持开启微信官方“商家转账到零钱”自动化打款分销佣金！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
