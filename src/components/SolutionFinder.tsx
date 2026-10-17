import { useState } from 'react';
import { Compass, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  onSelectSolution: (id: string) => void;
}

export function SolutionFinder({ onSelectSolution }: Props) {
  const [licenseType, setLicenseType] = useState<'individual_no_license' | 'sole_proprietor' | 'enterprise'>('individual_no_license');
  const [affiliateGoal, setAffiliateGoal] = useState<'two_tier' | 'single_tier' | 'independent_store'>('two_tier');
  const [infraPreference, setInfraPreference] = useState<'serverless' | 'vps_docker'>('serverless');

  // Recommendation logic
  let recommendedId = 'cloudflare-serverless';
  let advice = '';

  if (affiliateGoal === 'two_tier') {
    if (infraPreference === 'serverless') {
      recommendedId = 'cloudflare-serverless';
      advice = '您的核心需求是【二级裂变返佣】+【与 Cloudflare 授权结合】+【低运维】。最完美方案是将发卡与分销直接集成在 Cloudflare Workers + D1，既彻底摆脱 Dujiao-Next 只有单级返佣的硬伤，又省去跨服务器网络同步！';
    } else {
      recommendedId = 'domestic-affiliate-shop';
      advice = '您需要深度二级分销裂变，且愿意部署独立服务器。建议使用国内成熟的微信分销商城底座（如 CRMEB），支付成功后通过 API Webhook 将卡密写入 Cloudflare Workers。';
    }
  } else if (affiliateGoal === 'independent_store') {
    recommendedId = 'dujiao-enhanced';
    advice = '如果您只需要代理商自己加价卖（非两级全民推广返佣），Dujiao-Next 的分销商功能正好符合，但您依然需要补齐与 Cloudflare 授权服务的可靠 Webhook 握手机制。';
  } else {
    recommendedId = 'cloudflare-serverless';
    advice = '无论单级还是二级，Cloudflare Serverless 架构都能以零服务器成本和全球极低延迟运行，是现代化独立软件作者的最佳搭档。';
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white mb-10 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold">智能方案选型决策器 (30秒给出最佳落地方案)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Question 1 */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            1. 收款与主体资质：
          </label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="licenseType"
                checked={licenseType === 'individual_no_license'}
                onChange={() => setLicenseType('individual_no_license')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>个人无营业执照 (需要低门槛收微信/支付宝)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="licenseType"
                checked={licenseType === 'sole_proprietor'}
                onChange={() => setLicenseType('sole_proprietor')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>有个体户执照 (或可花¥300代办，最稳官方)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="licenseType"
                checked={licenseType === 'enterprise'}
                onChange={() => setLicenseType('enterprise')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>企业公司资质 (支持全套官方商户功能)</span>
            </label>
          </div>
        </div>

        {/* Question 2 */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            2. 推广返佣机制要求：
          </label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="affiliateGoal"
                checked={affiliateGoal === 'two_tier'}
                onChange={() => setAffiliateGoal('two_tier')}
                className="text-indigo-600 focus:ring-0"
              />
              <span className="font-semibold text-amber-300">必须两级同时返佣 (直推+间推裂变)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="affiliateGoal"
                checked={affiliateGoal === 'single_tier'}
                onChange={() => setAffiliateGoal('single_tier')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>只要单级推荐返利 (谁推归谁)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="affiliateGoal"
                checked={affiliateGoal === 'independent_store'}
                onChange={() => setAffiliateGoal('independent_store')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>代理开独立店铺赚加价差额</span>
            </label>
          </div>
        </div>

        {/* Question 3 */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            3. 服务器与运维偏好：
          </label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="infraPreference"
                checked={infraPreference === 'serverless'}
                onChange={() => setInfraPreference('serverless')}
                className="text-indigo-600 focus:ring-0"
              />
              <span className="font-semibold text-emerald-300">偏好 Cloudflare 边缘计算 (免运维/零成本)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-700/40">
              <input
                type="radio"
                name="infraPreference"
                checked={infraPreference === 'vps_docker'}
                onChange={() => setInfraPreference('vps_docker')}
                className="text-indigo-600 focus:ring-0"
              />
              <span>喜欢租用 VPS 自建 (PHP/MySQL/宝塔)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Decision Output Box */}
      <div className="bg-indigo-900/40 border border-indigo-400/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-lg shrink-0 mt-0.5">
            <Zap className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">诊断结果与决策建议</div>
            <div className="text-sm text-slate-200 mt-1 leading-relaxed">
              {advice}
            </div>
            {licenseType === 'individual_no_license' && (
              <div className="mt-1.5 text-xs text-amber-300 flex items-center gap-1">
                <span>收款建议: 个人无营业执照建议接入【虎皮椒 Xunhupay】，或者花 ¥300 代办个体户执照直连微信支付宝。</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onSelectSolution(recommendedId)}
          className="shrink-0 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
        >
          查看匹配方案详情
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
