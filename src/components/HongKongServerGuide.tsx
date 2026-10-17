import { useState } from 'react';
import { Server, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ShieldAlert, Cpu, HardDrive, Wifi, Sparkles, HelpCircle } from 'lucide-react';

interface ServerOption {
  id: string;
  provider: string;
  name: string;
  badge: string;
  badgeColor: string;
  priceMonthly: string;
  spec: {
    cpu: string;
    ram: string;
    disk: string;
    bandwidth: string;
    traffic: string;
  };
  network: {
    line: string;
    latency: string;
    telecom: string;
    unicom: string;
    mobile: string;
  };
  recommendedFor: string;
  pros: string[];
  cons: string[];
  dujiaoFit: 'perfect' | 'good' | 'not_recommended';
  verdict: string;
}

const HK_SERVERS: ServerOption[] = [
  {
    id: 'tencent_lighthouse_hk',
    provider: '腾讯云 (Tencent Cloud)',
    name: '腾讯云轻量应用服务器 (中国香港)',
    badge: '👑 最优首选 · 微信极度友好',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    priceMonthly: '约 ¥24 ~ ¥34 / 月 (特惠活动年付更低)',
    spec: {
      cpu: '2核',
      ram: '2GB 或 4GB',
      disk: '50GB ~ 80GB 高速 SSD',
      bandwidth: '30Mbps 峰值带宽',
      traffic: '1024 GB (1TB) / 月'
    },
    network: {
      line: '中国电信 CN2 + 联通骨干 + 移动 CMI 优质优化直连',
      latency: '20ms ~ 35ms (大陆三网秒开)',
      telecom: '极佳 (CN2 直连，无抖动)',
      unicom: '极佳 (直连，延迟约 25ms)',
      mobile: '良好 (CMI 直连，约 30ms)'
    },
    recommendedFor: '运行 Dujiao-Next、个人发卡、微信内分享推广海报的开发者',
    pros: [
      '腾讯官方大厂背书，微信生态兼容性极好（微信内置浏览器访问顺畅度高）',
      '线路对大陆极度友好，电信/联通/移动延迟普遍在 20ms~35ms 之间',
      '自带宝塔 Linux 面板、Docker 或纯净 Ubuntu 22.04 一键镜像',
      '控制台中文友好，绑定支付接口回调无阻碍'
    ],
    cons: [
      '基础防御为 2Gbps，若遭遇超大流量恶意 DDoS 攻击会进入腾讯云临时黑洞 2 小时（可通过前置 Cloudflare 免费防护化解）'
    ],
    dujiaoFit: 'perfect',
    verdict: '综合性价比、稳定度与微信兼容度的第一选择！闭眼入 2核2G 或 2核4G 配置即可轻松承载上万日访客。'
  },
  {
    id: 'aliyun_sas_hk',
    provider: '阿里云 (Alibaba Cloud)',
    name: '阿里云轻量应用服务器 (中国香港)',
    badge: '⚡ 老牌大厂 · 网络扎实',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    priceMonthly: '约 ¥24 ~ ¥34 / 月',
    spec: {
      cpu: '2核',
      ram: '2GB',
      disk: '60GB ESSD 云盘',
      bandwidth: '30Mbps 峰值带宽',
      traffic: '1024 GB (1TB) / 月'
    },
    network: {
      line: 'BGP 多线优化直连 (电信/联通直连，移动局部绕跑道)',
      latency: '25ms ~ 40ms',
      telecom: '优秀 (延迟约 28ms)',
      unicom: '优秀 (延迟约 26ms)',
      mobile: '良好 (晚高峰偶有波动)'
    },
    recommendedFor: '已有阿里云账号、喜欢阿里云生态与监控体系的开发者',
    pros: [
      '阿里云大厂网络基础设施完备，磁盘 IO 性能极强',
      '支持一键安装宝塔或 LEMP (Linux+Nginx+MySQL+PHP) 环境',
      '全球多地安全组和防火墙规则配置灵活'
    ],
    cons: [
      '部分批次移动宽带晚高峰延迟略有上涨（约 50ms~70ms）'
    ],
    dujiaoFit: 'perfect',
    verdict: '与腾讯云轻量并驾齐驱，如果有阿里云账号或代金券，直接选阿里云香港轻量完全没有任何问题。'
  },
  {
    id: 'ucloud_hk',
    provider: 'UCloud (优刻得) / 华为云香港',
    name: 'UCloud 快杰型 / 华为云 Flexus 香港',
    badge: '💼 政企可靠 · 适合长期商用',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    priceMonthly: '约 ¥40 ~ ¥80 / 月',
    spec: {
      cpu: '2核',
      ram: '2GB ~ 4GB',
      disk: '40GB ~ 60GB 高性能云盘',
      bandwidth: '2Mbps ~ 10Mbps 独享带宽 (按量或包年)',
      traffic: '按带宽计费或包月流量'
    },
    network: {
      line: '中港专线 BGP 直连 + 国际多线',
      latency: '25ms ~ 35ms',
      telecom: '稳定 CN2 直连',
      unicom: '优质骨干网直连',
      mobile: '优质直连'
    },
    recommendedFor: '对 IP 纯净度和独享带宽稳定性要求极高的小微团队',
    pros: [
      '公有云上市公司，IP 质量非常干净，几乎从不被连带封禁',
      '网络波动率极低，全天 24 小时延迟平稳'
    ],
    cons: [
      '入门价格相比大厂轻量应用略高，大带宽成本增加较快'
    ],
    dujiaoFit: 'good',
    verdict: '品质极佳的商业级选择，如果预算在 50~100元/月，不想凑大厂新人优惠，选 UCloud 或华为云香港体验极好。'
  },
  {
    id: 'overseas_generic_vps',
    provider: '海外通用 VPS (如 Vultr / Linode / AWS 默认香港)',
    name: '海外非针对大陆优化的香港机房',
    badge: '⚠️ 严重避坑警示',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    priceMonthly: '$5 ~ $10 / 月 (约 ¥35~¥70)',
    spec: {
      cpu: '1核 ~ 2核',
      ram: '1GB ~ 2GB',
      disk: '25GB SSD',
      bandwidth: '1000Mbps 国际共享带宽',
      traffic: '1TB ~ 2TB'
    },
    network: {
      line: '纯国际线路 (NTT / PCCW 绕日本或美国，未做大陆 CN2 优化)',
      latency: '200ms ~ 350ms (严重卡顿甚至超时)',
      telecom: '极差 (绕美或绕日，丢包 30%+)',
      unicom: '普通 (丢包 15%+)',
      mobile: '极差 (经常断流)'
    },
    recommendedFor: '海外纯外贸业务，千万别拿来给中国大陆客户卖软件！',
    pros: [
      '国际带宽极大，海外欧美访问快，支持信用卡与 PayPal'
    ],
    cons: [
      '大陆直连极慢！ping 延迟超过 250ms，晚高峰买家直接打不开结账收银台',
      'IP 段被污染和黑名单概率高，微信内几乎 100% 报红'
    ],
    dujiaoFit: 'not_recommended',
    verdict: '强烈避坑！很多新手以为“只要是香港机房就能在国内秒开”，其实没有 CN2/CMI 直连优化的香港机房比美国还卡！'
  }
];

export function HongKongServerGuide() {
  const [selectedServerId, setSelectedServerId] = useState<string>('tencent_lighthouse_hk');

  const currentServer = HK_SERVERS.find(s => s.id === selectedServerId) || HK_SERVERS[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              香港服务器实操选型与避坑全指南
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            免备案直连中国大陆 · 承载 Dujiao-Next + 微信支付宝回调与软件授权反查
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>黄金法则：认准【电信 CN2 + 移动 CMI 直连】，拒绝未优化国际机房</span>
        </div>
      </div>

      {/* Critical Knowledge Warning */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-6 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">为什么选香港？新手最容易踩的“假香港线路”大坑：</strong>
          <br />
          香港服务器最大的价值是<strong>免国内 ICP 备案</strong>，买来 10 分钟即可绑定域名上线开卖。
          但<strong>必须买“针对中国大陆优化线路（如腾讯云/阿里云的中国香港轻量）”</strong>。如果买了 Vultr 或海外普通主机的香港机房，数据会先跑到日本或美国再转回大陆，延迟比美国服务器还高！
        </div>
      </div>

      {/* 4 Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {HK_SERVERS.map((server) => {
          const isSelected = server.id === selectedServerId;
          return (
            <div
              key={server.id}
              onClick={() => setSelectedServerId(server.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${server.badgeColor}`}>
                    {server.badge}
                  </span>
                  {server.dujiaoFit === 'perfect' && (
                    <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded">
                      推荐
                    </span>
                  )}
                  {server.dujiaoFit === 'not_recommended' && (
                    <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">
                      避坑
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-medium">{server.provider}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                  {server.name}
                </div>

                <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-3">
                  {server.priceMonthly}
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2 mb-2">
                  <div className="flex justify-between"><span>配置:</span> <strong>{server.spec.cpu} / {server.spec.ram}</strong></div>
                  <div className="flex justify-between"><span>带宽:</span> <span>{server.spec.bandwidth}</span></div>
                  <div className="flex justify-between"><span>平均延迟:</span> <strong className={server.dujiaoFit === 'not_recommended' ? 'text-rose-500' : 'text-emerald-600'}>{server.network.latency}</strong></div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                {server.recommendedFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Server Deep Dive */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${currentServer.badgeColor}`}>
              {currentServer.provider}
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {currentServer.name} 深度技术指标
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              预估费用：{currentServer.priceMonthly}
            </span>
            {currentServer.id === 'tencent_lighthouse_hk' && (
              <a
                href="https://cloud.tencent.com/product/lighthouse"
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>直达腾讯云官网 (支持月付)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {currentServer.id === 'aliyun_sas_hk' && (
              <a
                href="https://www.aliyun.com/product/swas"
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>直达阿里云官网 (支持月付)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Spec & Network */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                硬件规格配置
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>CPU 算力：</span> <strong>{currentServer.spec.cpu}</strong></div>
                <div className="flex justify-between"><span>运行内存 (RAM)：</span> <strong>{currentServer.spec.ram} (完全满足 PHP+MySQL)</strong></div>
                <div className="flex justify-between"><span>硬盘存储：</span> <span>{currentServer.spec.disk}</span></div>
                <div className="flex justify-between"><span>峰值带宽：</span> <strong>{currentServer.spec.bandwidth}</strong></div>
                <div className="flex justify-between"><span>月度流量包：</span> <span>{currentServer.spec.traffic} (可卖几十万张卡密)</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                中国大陆三网实测表现
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>线路质量：</span> <span>{currentServer.network.line}</span></div>
                <div className="flex justify-between"><span>中国电信：</span> <strong>{currentServer.network.telecom}</strong></div>
                <div className="flex justify-between"><span>中国联通：</span> <strong>{currentServer.network.unicom}</strong></div>
                <div className="flex justify-between"><span>中国移动：</span> <strong>{currentServer.network.mobile}</strong></div>
              </div>
            </div>
          </div>

          {/* Pros, Cons, and Deployment Guide */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-2">优劣势评估</div>
              <div className="space-y-1.5 mb-3">
                {currentServer.pros.map((pro, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </div>
                ))}
                {currentServer.cons.map((con, cIdx) => (
                  <div key={cIdx} className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                <strong>推荐指数裁决：</strong>{currentServer.verdict}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Purchase Steps */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-5 text-xs">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          新手推荐购买与 Dujiao-Next 部署标准化流程 (约 15 分钟完成)：
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">步骤 1: 选购开通</span>
            登录<strong>腾讯云</strong>或<strong>阿里云</strong>官网，搜索“轻量应用服务器”，地域必须勾选<strong>【中国香港】</strong>，配置选 <strong>2核2G 或 2核4G</strong>。
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">步骤 2: 系统选择</span>
            镜像建议选择 <strong>Ubuntu 22.04 LTS</strong> 或应用镜像里的 <strong>宝塔 Linux 面板 (BT-Panel)</strong>，省去手动配 Nginx/PHP 的繁琐命令。
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">步骤 3: 域名解析</span>
            将买好的独立域名（如 <code className="bg-slate-100 dark:bg-slate-800 px-1">shop.yourdomain.com</code>）直接 A 记录解析到这台香港服务器的公网 IP，<strong>免备案立刻生效</strong>。
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">步骤 4: 安装 Dujiao</span>
            在宝塔面板内一键创建站点，拉取 Dujiao-Next 源码，配置好虎皮椒支付参数与一级返佣比例，即可立即发卡！
          </div>
        </div>
      </div>
    </div>
  );
}
