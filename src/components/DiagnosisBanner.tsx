import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onSelectSolution: (id: string) => void;
}

export function DiagnosisBanner({ onSelectSolution }: Props) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-indigo-500/20 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              针对您上传截图的需求深度诊断
            </span>
            <span className="text-slate-400 text-xs">基于 Dujiao-Next 现状与缺口分析</span>
          </div>
          <button
            onClick={() => onSelectSolution('cloudflare-serverless')}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            直接查看最优替代方案：Cloudflare 一体化架构
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">
          软件卡密销售 · 二级分销返佣 · 微信支付宝收款最优解
        </h1>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl mb-6">
          您当前调研的 <span className="font-semibold text-white">Dujiao-Next</span> 是经典发卡系统，但存在两个<span className="text-rose-400 font-semibold">关键瓶颈</span>：
          一是<strong className="text-amber-300">不支持原生二级推广返佣</strong>（内置仅单级，无法实现“上级发展下级、二级同时分润”的裂变效果）；
          二是发卡商城与 <strong className="text-cyan-300">Cloudflare 授权服务之间是跨网络割裂的</strong>，极易发生网络超时导致丢单、卡密伪造与退款未核销。
        </p>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">模块 1: 软件与卡密</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-semibold text-slate-100 text-sm mb-1">付款后自动交付卡密</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dujiao-Next 具备基本库存发卡，但如果需要结合软件激活，更推荐“按需动态生成带签名授权码”，而非纯死板固定卡密。
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">模块 2: 收款资质</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-semibold text-slate-100 text-sm mb-1">微信 / 支付宝收款</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              无执照建议选用合规聚合协议（如虎皮椒）；长期运营建议办理个体户营业执照（仅¥300），直连官方微信支付宝享 0.6% 低费率。
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">模块 3: 推广返佣 (重大转机)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-semibold text-slate-100 text-sm mb-1">若只需一级返佣：开箱即用！</div>
            <p className="text-xs text-slate-300/80 leading-relaxed">
              Dujiao-Next 原生内置每笔订单单级推广提成！如果无需二级裂变，该系统完全可用，免去底层数据库改造。
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">模块 4: 授权服务闭环</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="font-semibold text-indigo-200 text-sm mb-1">Cloudflare Workers 结合</div>
            <p className="text-xs text-indigo-300/80 leading-relaxed">
              若将“商城发卡+二级分销”直接搬入 Cloudflare D1 边缘运行，发卡即授权，省去所有 Webhook 跨服务器同步难题！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
