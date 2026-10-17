import { useState } from 'react';
import { SOLUTIONS_DATA } from '../data/solutionsData';
import { SolutionOption } from '../types/solution';
import { Check, X, Star, ExternalLink, Sparkles, Server, Zap, Shield, HelpCircle } from 'lucide-react';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ComparisonMatrix({ selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<'all' | 'high_rating'>('all');

  const displayedSolutions = filter === 'high_rating'
    ? SOLUTIONS_DATA.filter(s => s.rating >= 4.0)
    : SOLUTIONS_DATA;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">主流解决方案综合对比矩阵</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              4套方案横评
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            横向对比原生 Serverless 一体化、Dujiao-Next 二开改造、国内微信生态分销商城与海外出海方案
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            全部方案
          </button>
          <button
            onClick={() => setFilter('high_rating')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              filter === 'high_rating'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            高评分 (4.0+)
          </button>
        </div>
      </div>

      {/* Grid of Solutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayedSolutions.map((solution) => {
          const isSelected = selectedId === solution.id;
          return (
            <div
              key={solution.id}
              onClick={() => onSelect(solution.id)}
              className={`rounded-xl border transition-all cursor-pointer p-5 flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                  当前查看详情
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${solution.badgeColor}`}>
                    {solution.badge}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{solution.rating.toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {solution.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {solution.summary}
                </p>

                {/* Core Attributes */}
                <div className="space-y-2 text-xs border-y border-slate-100 dark:border-slate-800/80 py-3 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium shrink-0">卡密交付:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right">{solution.keyDelivery}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium shrink-0">二级分销返佣:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right font-medium">{solution.affiliateSupport}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium shrink-0">微信/支付宝:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right">{solution.paymentSupport}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium shrink-0">与 Cloudflare 结合:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                      {solution.cloudflareIntegration}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium shrink-0">运维与成本:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right">{solution.maintenanceCost}</span>
                  </div>
                </div>

                {/* Pros and Cons Highlights */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    核心优势:
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc marker:text-emerald-500">
                    {solution.pros.slice(0, 2).map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>

                  <div className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 pt-1">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    潜在局限:
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pl-4 list-disc marker:text-rose-500">
                    {solution.cons.slice(0, 2).map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer Recommendation */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">专家裁决:</strong> {solution.verdict}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
