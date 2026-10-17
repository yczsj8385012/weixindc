import { useState } from 'react';
import { Users, DollarSign, ArrowDown, ShieldAlert, Sparkles, TrendingUp, Info, CheckCircle2 } from 'lucide-react';

export function CommissionSimulator() {
  const [affiliateMode, setAffiliateMode] = useState<'tier1' | 'tier2'>('tier1');
  const [productPrice, setProductPrice] = useState<number>(99);
  const [salesVolume, setSalesVolume] = useState<number>(100);
  const [tier1Rate, setTier1Rate] = useState<number>(40); // 40% 直推
  const [tier2Rate, setTier2Rate] = useState<number>(10); // 10% 间推
  const [paymentFeeRate, setPaymentFeeRate] = useState<number>(0.6); // 0.6%

  const effectiveTier2Rate = affiliateMode === 'tier2' ? tier2Rate : 0;

  const totalGross = productPrice * salesVolume;
  const paymentFee = totalGross * (paymentFeeRate / 100);
  const tier1Total = totalGross * (tier1Rate / 100);
  const tier2Total = totalGross * (effectiveTier2Rate / 100);
  const platformNetProfit = totalGross - paymentFee - tier1Total - tier2Total;

  const perUnitTier1 = productPrice * (tier1Rate / 100);
  const perUnitTier2 = productPrice * (effectiveTier2Rate / 100);
  const perUnitPlatform = productPrice - (productPrice * (paymentFeeRate / 100)) - perUnitTier1 - perUnitTier2;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              推广返佣精算器：一级返佣 vs 二级裂变
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            针对您提出的“只需一级返佣也可以”：Dujiao-Next 原生即可完美满足，架构复杂度大幅下降！
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setAffiliateMode('tier1')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              affiliateMode === 'tier1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
            一级返佣模式 (Dujiao原生支持 · 强烈推荐)
          </button>
          <button
            onClick={() => setAffiliateMode('tier2')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              affiliateMode === 'tier2'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            两级裂变模式 (直推+间推)
          </button>
        </div>
      </div>

      {/* Mode Callout Note */}
      {affiliateMode === 'tier1' ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3.5 mb-6 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>重大减负利好：</strong>只要确定采用<strong>一级返佣</strong>，您截图里担心的“Dujiao-Next 二级推广缺口”便不复存在！Dujiao-Next 自带的单笔订单返佣机制完全开箱即用，无需任何二次开发。
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl p-3.5 mb-6 text-xs text-purple-800 dark:text-purple-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>二级模式提示：</strong>二级返佣能激励大队长拉小弟，但必须自建或使用支持两级树的系统（如 Cloudflare D1 或 CRMEB 改装）。
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>软件零售单价 (元)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">¥ {productPrice}</span>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setProductPrice(29.9)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold cursor-pointer ${
                    productPrice === 29.9
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  三个月卡 (¥29.9)
                </button>
                <button
                  type="button"
                  onClick={() => setProductPrice(99)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold cursor-pointer ${
                    productPrice === 99
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  年卡 (¥99)
                </button>
              </div>
              <input
                type="range"
                min="19"
                max="999"
                step="10"
                value={productPrice}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>预计月销量 (单)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{salesVolume} 单</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={salesVolume}
                onChange={(e) => setSalesVolume(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className={`grid ${affiliateMode === 'tier2' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>一级返佣 (直推提成)</span>
                  <span className="text-indigo-600 font-bold">{tier1Rate}%</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={tier1Rate}
                  onChange={(e) => setTier1Rate(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              {affiliateMode === 'tier2' && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>二级返佣 (间推提成)</span>
                    <span className="text-purple-600 font-bold">{tier2Rate}%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={tier2Rate}
                    onChange={(e) => setTier2Rate(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>支付通道费率</span>
                <span className="font-semibold">{paymentFeeRate}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentFeeRate(0.6)}
                  className={`text-[11px] px-2.5 py-1 rounded border cursor-pointer ${
                    paymentFeeRate === 0.6
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  官方微信/支付宝 (0.6%)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFeeRate(2.5)}
                  className={`text-[11px] px-2.5 py-1 rounded border cursor-pointer ${
                    paymentFeeRate === 2.5
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  聚合代收/虎皮椒 (2.5%)
                </button>
              </div>
            </div>
          </div>

          {/* Benefits of Tier 1 */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
            <div className="font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              为什么只做“一级返佣”往往更赚钱、更合规？
            </div>
            <p>1. <strong>毛利更高</strong>：无需保留间推预算，作者直接多拿 10%~15% 净利润；</p>
            <p>2. <strong>直推动力更强</strong>：可以把一级提成直接拉高到 25%~35%，推广员看到每单能拿几十上百元，分享欲望极强；</p>
            <p>3. <strong>零合规风险</strong>：完全不存在多层计酬的任何争议，财税申报清晰无纠纷。</p>
          </div>
        </div>

        {/* Tree Visualizer */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              {affiliateMode === 'tier1' ? '一级返佣链路透视' : '两级返佣链路透视'} (单笔订单 ¥{productPrice})
            </div>

            <div className="space-y-3">
              {/* Grandparent (Only in Tier 2) */}
              {affiliateMode === 'tier2' && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                        A
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">二级领队 (Grandparent)</div>
                        <div className="text-[11px] text-purple-600 dark:text-purple-400">间推团队奖励 ({tier2Rate}%)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400">+¥{perUnitTier2.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">月收 ¥{tier2Total.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex justify-center -my-1 text-slate-400">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                </>
              )}

              {/* Direct Referrer */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    B
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">直推分销员 (Referrer)</div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
                      直接分享成交佣金 ({tier1Rate}%) · {affiliateMode === 'tier1' ? 'Dujiao-Next 内置支持' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">+¥{perUnitTier1.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">月收 ¥{tier1Total.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-center -my-1 text-slate-400">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Buyer */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
                    C
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">最终消费者 (Buyer)</div>
                    <div className="text-[11px] text-slate-500">付款购买卡密并绑定授权</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">-¥{productPrice.toFixed(2)}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">即时下发激活码</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-0.5">月度总流水</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                ¥{totalGross.toLocaleString()}
              </span>
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block mb-0.5">
                推广佣金总支出 ({tier1Rate + effectiveTier2Rate}%)
              </span>
              <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                ¥{(tier1Total + tier2Total).toLocaleString()}
              </span>
            </div>

            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-0.5">作者净收益</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ¥{platformNetProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
