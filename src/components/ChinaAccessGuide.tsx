import { useState } from 'react';
import { Globe, AlertTriangle, CheckCircle2, Zap, Shield, HelpCircle, ArrowRight, RefreshCw, Server, Wifi } from 'lucide-react';

export function ChinaAccessGuide() {
  const [selectedSolution, setSelectedSolution] = useState<'best_practice' | 'edgeone' | 'hk_vps' | 'cf_custom'>('best_practice');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              中国大陆客户访问专项评估与加速策略 (至关重要)
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            正面回答：“如果客户全在大脑大陆，Cloudflare 会不会打不开或被墙？”
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>结论：默认配置确实受影响！但只需简单调优即可稳定秒开</span>
        </div>
      </div>

      {/* Direct Answer & Reality Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Reality Check 1 */}
        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            默认裸用 Cloudflare 在大陆的 3 大致命硬伤：
          </div>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-rose-500 leading-relaxed">
            <li>
              <strong>默认域名被阻断</strong>：Cloudflare 默认赠送的 <code className="bg-rose-100 dark:bg-rose-900/50 px-1 rounded text-rose-800 dark:text-rose-200">*.workers.dev</code> 和部分 <code className="bg-rose-100 dark:bg-rose-900/50 px-1 rounded text-rose-800 dark:text-rose-200">*.pages.dev</code> 在大陆部分省份电信/移动是<strong>直接被 DNS 污染或 SNI 阻断</strong>的，客户裸连会直接报超时！
            </li>
            <li>
              <strong>晚高峰丢包与延迟</strong>：默认免费分配的 Anycast 节点多在美国西海岸，大陆晚高峰（20:00-23:00）延迟高达 250ms~400ms，丢包率可能达 15%~30%。
            </li>
            <li>
              <strong>微信内置浏览器拦截（红标风险）</strong>：如果客户在微信群、朋友圈直接点开未经处理的海外发卡网址，极容易被微信安全拦截提示“已停止访问该网页”。
            </li>
          </ul>
        </div>

        {/* The Good News */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            但完全不用担心！成熟团队的 3 步破解方案：
          </div>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-emerald-500 leading-relaxed">
            <li>
              <strong>必须绑定自定义独立域名</strong>：花 ¥50 买一个 <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 rounded text-emerald-800 dark:text-emerald-200">.com / .top / .cn</code> 域名绑定到 Cloudflare，立刻避开 workers.dev 的域名黑名单。
            </li>
            <li>
              <strong>启用 Cloudflare 优选 IP (SaaS CNAME 接入)</strong>：将域名智能解析到针对中国移动/电信最优的香港、东京或美国直连节点，延迟瞬间降到 <strong>45ms~75ms</strong>，秒开商城。
            </li>
            <li>
              <strong>客户端软件心跳内置离线宽限期 (Grace Period)</strong>：哪怕用户所在网络极其恶劣短时间连不上验证服务器，软件允许在 <strong>72小时内离线正常使用</strong>，用户毫无卡顿感知。
            </li>
          </ul>
        </div>
      </div>

      {/* Accelerations Solution Selector */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-indigo-500" />
          针对中国大陆客户的 3 大最佳落地网络架构对比：
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: CF + CNAME SaaS 優選 */}
          <div
            onClick={() => setSelectedSolution('cf_custom')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSolution === 'cf_custom'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  方案 A: Cloudflare + 自定义域名优选 IP
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  免备案 · 低成本
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                继续用 Cloudflare Worker + D1，但通过自定义域名 + 优选官方 Anycast IP 加速大陆访问。
              </p>
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>大陆延迟:</span> <strong className="text-indigo-600">50ms ~ 90ms (良)</strong></div>
                <div className="flex justify-between"><span>备案要求:</span> <span>无需备案</span></div>
                <div className="flex justify-between"><span>月均费用:</span> <span>接近 ¥0</span></div>
              </div>
            </div>
          </div>

          {/* Option 2: 香港轻量服务器反代 Cloudflare */}
          <div
            onClick={() => setSelectedSolution('hk_vps')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSolution === 'hk_vps'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  方案 B: 香港轻量云服务器前端反代 (推荐)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  最稳最快 · 免备案
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                花 ¥24/月 买一台腾讯云/阿里云香港轻量服务器做反向代理，后端仍是 Cloudflare Worker + D1。
              </p>
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>大陆延迟:</span> <strong className="text-emerald-600">20ms ~ 40ms (极佳)</strong></div>
                <div className="flex justify-between"><span>备案要求:</span> <span>无需备案</span></div>
                <div className="flex justify-between"><span>月均费用:</span> <span>约 ¥24 / 月</span></div>
              </div>
            </div>
          </div>

          {/* Option 3: 腾讯云 EdgeOne / 国内合规全备案 */}
          <div
            onClick={() => setSelectedSolution('edgeone')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedSolution === 'edgeone'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  方案 C: 国内备案 + 腾讯云 EdgeOne 边缘函数
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  终极合规 · 微信防封
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                办个体户后完成域名 ICP 备案，直接使用国内 CDN / EdgeOne 边缘函数，微信内打开从不报红。
              </p>
              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>大陆延迟:</span> <strong className="text-emerald-600">10ms ~ 20ms (国内直连)</strong></div>
                <div className="flex justify-between"><span>备案要求:</span> <span>需要 ICP 备案</span></div>
                <div className="flex justify-between"><span>微信环境:</span> <span className="text-emerald-600 font-semibold">100% 绿标安全</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep-dive details on selected solution */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-xs">
        {selectedSolution === 'cf_custom' && (
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
              实操步骤：如何免费用 Cloudflare 自定义域名加速大陆访问？
            </div>
            <ol className="space-y-1.5 pl-4 list-decimal text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>在腾讯云、阿里云或 NameSilo 购买一个域名（如 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">mysoftapp.com</code>）。</li>
              <li>将域名接入 Cloudflare，然后在 Cloudflare Workers 设置页面，添加该域名作为 <strong>Custom Domain (自定义域名)</strong>，比如 <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">api.mysoftapp.com</code>。</li>
              <li><strong>重要技巧</strong>：在 DNS 解析处，配合开源的“Cloudflare 优选 IP 脚本”（自动筛选电信 162.159.xxx / 联通 104.16.xxx 最优 IP），将买家流量导向最优线路，大陆访问不再卡顿。</li>
            </ol>
          </div>
        )}

        {selectedSolution === 'hk_vps' && (
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
              最稳极客方案：香港云服务器反向代理架构（强烈推荐给个人作者）
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              这是目前国内独立开发者最常用的折中方案，既<strong>保留了 Cloudflare Workers + D1 的零运维和自动化分销</strong>，又给大陆买家提供媲美国内直连的极速体验：
            </p>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] mb-2 overflow-x-auto">
              [大陆买家浏览器/客户端] ──(CN2直连, 25ms)──&gt; [香港轻量服务器 Nginx 反代] ──(海外专线, 10ms)──&gt; [Cloudflare Worker &amp; D1 核心]
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              阿里云/腾讯云香港轻量服务器经常做活动，24元/月即可搞定，免备案且大陆各地访问极度稳定。
            </p>
          </div>
        )}

        {selectedSolution === 'edgeone' && (
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-2 text-sm">
              合规企业方案：国内备案 + 腾讯云 EdgeOne (相当于国内版 Cloudflare)
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
              如果您的软件需要在微信朋友圈、微信群内通过分销裂变海报快速推广，<strong>域名防封与备案是头等大事</strong>。
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              办理个体工商户营业执照（约 ¥300）后，可以在腾讯云一键提交 ICP 备案（通常 5~10 个工作日）。备案通过后，您可以使用<strong>腾讯云 EdgeOne（边缘安全加速平台）</strong>，它的 Edge Functions 与 Cloudflare Workers 语法几乎完全一致，在大陆有数千个骨干节点，彻底无任何访问阻碍，微信内扫码支付丝滑顺畅。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
