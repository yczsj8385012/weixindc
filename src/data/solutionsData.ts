import { SolutionOption, PaymentMethod } from '../types/solution';

export const SOLUTIONS_DATA: SolutionOption[] = [
  {
    id: 'cloudflare-serverless',
    name: 'Cloudflare 一体化 Serverless 架构 (推荐方案)',
    badge: '👑 最佳技术架构',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    rating: 4.9,
    recommendedFor: '希望卡密发货、二级返佣、软件授权校验高度闭环，追求零服务器运维、超快全球响应与极致性价比的开发者',
    summary: '用 Cloudflare Pages (前端商城) + Workers (API/支付回调) + D1 (关系型数据库) 统一承载“发卡、二级裂变、激活与心跳校验”。免去商城与授权服务跨系统调用的所有断裂风险。',
    keyDelivery: '原生内置：支付成功回调 Worker 内直接通过 D1 事务生成/发放激活码并标记归属，支持邮件自动推送。',
    paymentSupport: '极佳：Worker 接收微信/支付宝（如虎皮椒、官方商户号或第三方聚合支付）的 Webhook 回调，验证签名后完成结算。',
    affiliateSupport: '原生二级分销：在 D1 中设计 parent_id 和 grandparent_id，订单支付成功时原子性写入两级佣金流水，支持提现申请与防刷机制。',
    cloudflareIntegration: '100% 同构原生：授权验证无需通过跨网络 API，软件直接请求同一个 Cloudflare Worker 校验机器码并签发 JWT。',
    maintenanceCost: '接近 ¥0 / 月（免费计划含每日 10 万次 Worker 请求 + 500 万次 D1 读取；付费版仅 $5/月）。',
    developmentEffort: '中等（基于现有全栈模板约 1~2 天即可上线，一次编写终身免维护）。',
    pros: [
      '原子一致性：支付、两级分销记账、卡密发货、机器码授权在同一个 D1 事务中，杜绝丢单和虚假发货',
      '全球边缘加速：客户端请求授权验证（激活/心跳）毫秒级就近响应',
      '无服务器运维：无需买 VPS 云主机、无需装宝塔/MySQL/Nginx，天生抗 CC/DDoS 攻击',
      '二级返佣完全自主可控：可任意定制分销比例、冻结保护期、提现规则'
    ],
    cons: [
      '需要具备一定前端和 Worker 部署基础（或直接使用我们提供的开箱即用模板）',
      '后台管理面板需要简易的前端管理界面（搭配 Tailwind 或现成 Admin UI）'
    ],
    verdict: '强烈推荐！彻底解决您图片中提到的“Dujiao-Next 只有单级分销”和“商城与 Cloudflare 授权需二次同步”的双重缺陷。'
  },
  {
    id: 'dujiao-enhanced',
    name: 'Dujiao-Next 原生 + Cloudflare 授权桥接 (现成轻量解)',
    badge: '⚡ 一级返佣开箱即用',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    rating: 4.6,
    recommendedFor: '如果您只需要【一级返佣】，Dujiao-Next 自带的推广返利完全开箱即用！只需解决与 Cloudflare 的授权同步和微信支付宝收款即可。',
    summary: '利用 Dujiao-Next 现成的漂亮商城前台、后台库存管理与原生一级推广员返佣系统。通过标准 Webhook 或客户端激活时反查 API 桥接 Cloudflare 机器码授权。',
    keyDelivery: 'Dujiao-Next 原生卡密库存发货（免开发，上传卡密列表即可）。',
    paymentSupport: '支持多种支付插件（虎皮椒代收、当面付、易支付均有现成插件）。',
    affiliateSupport: '原生一级返佣 100% 完美支持：内置推广功能对每笔订单生成一条佣金记录，支持推广员提现。',
    cloudflareIntegration: '通过 Webhook 或反向核验 API 桥接：支付成功后调用 Cloudflare Worker 录入已售卡密，或由客户端激活时反查商城订单。',
    maintenanceCost: '轻量云服务器（如腾讯云香港轻量 ¥24/月，免备案且大陆直连）。',
    developmentEffort: '极低（无需魔改分销代码，只需配置一个通知 Cloudflare 的接口）。',
    pros: [
      '无需任何二次开发即可使用漂亮商城前台和后台管理系统',
      '原生自带一级推广返利与推广链接统计，分销员提现清晰',
      '市面上有很多 Dujiao-Next 的支付插件和使用教程，生态成熟'
    ],
    cons: [
      '仍需维持一台轻量 VPS 云服务器（安装 PHP/Node + MySQL）',
      '需要配置好商城支付成功通知 Cloudflare 的重试机制，防止断网掉单'
    ],
    verdict: '由于您只需一级返佣，Dujiao-Next 瞬间从“有硬伤”升级为“高分落地选择”！直接省去二开成本。'
  },
  {
    id: 'domestic-affiliate-shop',
    name: '国内成熟分销商城改装 (CRMEB / 禾匠二次对接)',
    badge: '💼 深度分销运营专家',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    rating: 4.1,
    recommendedFor: '分销业务极其复杂（如团队极差、分销等级、提现审核、海报裂变、多级分佣）且重度依赖微信生态的团队',
    summary: '采用国内开源成熟的分销商城系统（如 CRMEB），天然拥有严谨完善的二级分销、团队分红、推广海报与提现管理。通过定制“虚拟商品自动发货 Hook”调用 Cloudflare API 录入授权。',
    keyDelivery: '通过订单支付完成事件，触发调用 Cloudflare Worker 接口动态生成并下发卡密。',
    paymentSupport: '官方微信支付/支付宝官方接口深度整合，支持微信商户自动打款提现。',
    affiliateSupport: '业界顶配：原生支持两级返佣、分销商等级、自定义海报、分销排行榜、自动提现结算。',
    cloudflareIntegration: '通过标准 REST API 对接：CRMEB 支付成功后 POST 到 Cloudflare Workers 录入激活码。',
    maintenanceCost: '云服务器配置要求较高（通常需要 2核4G 以上，约 ¥100~300/月）。',
    developmentEffort: '中等（只需在 CRMEB 的发货钩子里编写 Cloudflare API 互通代码）。',
    pros: [
      '二级分销体验极强，分销员可在微信中随时查看下级团队和佣金变动',
      '自带完备的财务对账、发票、提现审核与合规流转机制'
    ],
    cons: [
      '系统整体较重，针对单纯卖软件卡密有点“大炮打蚊子”',
      '海外用户访问速度慢，国内服务器需要备案域名'
    ],
    verdict: '如果您的核心打法是“社群招募几百个代理做裂变式推广”，且主战场在国内微信环境，这个方案在运营体验上最舒服。'
  },
  {
    id: 'global-mor',
    name: '海外出海 MoR 方案 (Lemon Squeezy / Creem / Paddle)',
    badge: '🌍 跨境出海首选',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    rating: 4.3,
    recommendedFor: '海外软件出海、独立开发者，面向全球用户，想把税务合规全托出去的软件项目',
    summary: '利用 Lemon Squeezy 或 Creem 等作为名义商户 (Merchant of Record)。自带 License Key 生成、Affiliate 分销系统与全球信用卡/PayPal 支付。',
    keyDelivery: 'SaaS 原生支持 License Key 生成与激活限制。',
    paymentSupport: '全球信用卡、Apple Pay、Google Pay、PayPal（部分支持支付宝，但微信支付极弱或不支持）。',
    affiliateSupport: '自带推广员链接与佣金分成追踪功能（部分支持自定义分销比例）。',
    cloudflareIntegration: '提供官方 Webhook 与 License API，可与 Cloudflare Workers 轻松互联。',
    maintenanceCost: '无基础月租，但抽成较高（通常 5% + $0.50 每笔交易）。',
    developmentEffort: '极低（几乎零代码，嵌入 JavaScript 结账按钮即可）。',
    pros: [
      '完全无需操心各地增值税 (VAT)、销售税计算与申报',
      '开箱即用，内置软件卡密与设备激活限制'
    ],
    cons: [
      '国内微信支付体验差甚至不支持，不适合以国内微信/支付宝为主的客群',
      '分销返佣无法直接分润到微信零钱/支付宝，外币提现有门槛'
    ],
    verdict: '如果是出海软件无可挑剔；但如果您主营中国大陆微信/支付宝，此方案用户转化率会受较大影响。'
  }
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    name: '个体工商户 + 官方微信/支付宝商户号 (终极长期解法)',
    targetAudience: '正式运营、追求稳定、杜绝风控被封的开发者',
    qualification: '个体工商户营业执照（网上代办约 ¥200~500，无需实际租办公场地）',
    rate: '0.6% (国家官方基准费率，全行业最低)',
    stability: '极高 (官方直连)',
    settlement: '微信 T+1 自动结算到个人银行卡，支付宝 T+0 实时到账',
    features: [
      '官方 Native 扫码付、JSAPI 微信内支付、H5 手机浏览器支付全支持',
      '无中间商抽成，没有任何跑路风险',
      '资金流合法合规，避免个人微信频繁转账导致的大额风控冻结',
      '支持通过微信商家转账直接给分销员返佣打款到微信零钱'
    ],
    setupCost: '极低（¥200~¥500 一次性代办执照成本）',
    recommended: true
  },
  {
    name: '虎皮椒 (XunhuPay) 个人微信/支付宝接口',
    targetAudience: '不想办营业执照、快速验证项目的个人开发者',
    qualification: '仅需个人身份证实名认证即可开通',
    rate: '微信约 2%~2.5%，支付宝约 1.5%~2%',
    stability: '高 (合规代收)',
    settlement: '直接结算到绑定的个人微信/支付宝账户',
    features: [
      '运营多年，合规性与口碑在独立开发者圈极高',
      '提供标准的开发 API 和 Webhook 异步回调通知',
      '无需挂机软件、无需个人微信常驻手机监听',
      '自带收银台页面，支持扫码和手机唤起微信/支付宝'
    ],
    setupCost: '一次性开户费（约 ¥100~¥200）',
    recommended: true
  },
  {
    name: '支付宝当面付 (个人版)',
    targetAudience: '只需要支持支付宝收款、有门头照即可开通的用户',
    qualification: '无需营业执照，个人支付宝提交门头照即可申请',
    rate: '0.6% 官方费率',
    stability: '极高 (官方直连)',
    settlement: '实时到账个人支付宝余额',
    features: [
      '支付宝官方通道，体验丝滑',
      '单笔限制通常几百元以内，适合轻量低单价软件',
      '缺点是完全不支持微信支付'
    ],
    setupCost: '¥0 (官方免费申请)',
    recommended: false
  },
  {
    name: '第三方聚合易支付 (Pay / Epusdt)',
    targetAudience: '发卡圈常见通道，支持法币和 USDT 虚拟币',
    qualification: '绝大多数免认证或只需基础实名',
    rate: '3% ~ 6% 较高手续费',
    stability: '中 (聚合渠道)',
    settlement: '平台人工/定时结算，资金在平台沉淀',
    features: [
      '发卡系统（包括 Dujiao-Next）默认兼容度最高',
      '渠道不稳定，平台跑路、掉单、通道被风控概率高',
      '仅建议作为兜底备用，不建议主营资金经过小平台'
    ],
    setupCost: '通常免费或极低入驻费',
    recommended: false
  }
];

export const CLOUDFLARE_D1_SCHEMA = `-- 1. 用户与分销绑定表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- 用户唯一ID (如 UUID)
  email TEXT UNIQUE NOT NULL,        -- 邮箱 (用于交付卡密与找回)
  parent_id TEXT,                    -- 一级邀请人 (Direct Referrer)
  grandparent_id TEXT,               -- 二级邀请人 (Indirect Referrer)
  wallet_balance REAL DEFAULT 0.0,   -- 可提现佣金余额 (元)
  total_commission REAL DEFAULT 0.0, -- 累计获得佣金 (元)
  created_at INTEGER NOT NULL
);

-- 2. 软件卡密与授权状态表
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,  -- 卡密字符串 (如 PRO-XXXX-XXXX-XXXX)
  plan_type TEXT NOT NULL,           -- 版本: monthly / yearly / lifetime
  status TEXT DEFAULT 'UNSOLD',      -- UNSOLD (未售) | ACTIVE (已激活) | BANNED (已封禁) | REFUNDED (已退款)
  order_id TEXT,                     -- 绑定的购买订单号
  buyer_email TEXT,                  -- 购买者邮箱
  bound_machine_id TEXT,             -- 首次激活绑定的唯一机器特征码 (如主板UUID+CPU散列)
  max_devices INTEGER DEFAULT 1,     -- 允许绑定的最大设备数
  activated_at INTEGER,              -- 首次激活时间戳
  expires_at INTEGER,                -- 到期时间戳 (永久版设为 2099 年)
  last_heartbeat_at INTEGER          -- 最近一次在线心跳校验时间
);

-- 3. 订单与支付记录表
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,               -- 本地系统订单号
  trade_no TEXT,                     -- 微信/支付宝官方流水号
  amount REAL NOT NULL,              -- 支付金额 (元)
  status TEXT DEFAULT 'PENDING',     -- PENDING | PAID | REFUNDED
  buyer_id TEXT NOT NULL,            -- 购买者ID
  license_id TEXT,                   -- 分配的卡密ID
  direct_commission REAL DEFAULT 0,  -- 一级返佣金额
  indirect_commission REAL DEFAULT 0,-- 二级返佣金额
  paid_at INTEGER,
  created_at INTEGER NOT NULL
);

-- 4. 佣金变动明细账本 (防止资金对不上)
CREATE TABLE IF NOT EXISTS commission_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  beneficiary_id TEXT NOT NULL,      -- 获得佣金的分销员
  tier INTEGER NOT NULL,             -- 1: 一级直推, 2: 二级间推
  commission_amount REAL NOT NULL,   -- 佣金金额
  status TEXT DEFAULT 'SETTLED',     -- FROZEN (冻结期内) | SETTLED (已结算入账) | REVERTED (已退款扣除)
  created_at INTEGER NOT NULL
);`;

export const WORKER_IMPLEMENTATION_CODE = `/**
 * Cloudflare Worker: 微信/支付宝 Webhook 处理 + 二级分销结算 + 授权验证一体化
 * 运行环境: Cloudflare Workers + D1 Database
 */

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  PAYMENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. 支付网关异步回调接口 (以虎皮椒/微信支付回调为例)
    if (url.pathname === '/api/payment/webhook' && request.method === 'POST') {
      const payload = await request.json();
      
      // 验证支付签名 (以 HMAC-SHA256 为例)
      if (!verifyPaymentSignature(payload, env.PAYMENT_SECRET)) {
        return new Response('Invalid Signature', { status: 400 });
      }

      const { order_id, trade_no, amount, buyer_id } = payload;

      // 开启原子事务：更新订单 -> 分配卡密 -> 计算二级佣金
      const db = env.DB;
      
      // 查找待分配的未售卡密 (原子锁定)
      const license = await db.prepare(
        "SELECT * FROM licenses WHERE status = 'UNSOLD' LIMIT 1"
      ).first();

      if (!license) {
        return new Response('No available license inventory', { status: 500 });
      }

      // 获取买家的上级与上上级 (两级分销裂变)
      const buyer = await db.prepare(
        "SELECT parent_id, grandparent_id FROM users WHERE id = ?"
      ).bind(buyer_id).first();

      const directRate = 0.20;   // 一级返佣 20%
      const indirectRate = 0.10; // 二级返佣 10%
      const directAmt = buyer?.parent_id ? Number((amount * directRate).toFixed(2)) : 0;
      const indirectAmt = buyer?.grandparent_id ? Number((amount * indirectRate).toFixed(2)) : 0;

      // 批量执行原子写入
      await db.batch([
        // 1. 标记卡密已售出并绑定订单
        db.prepare(
          "UPDATE licenses SET status = 'ACTIVE', order_id = ?, buyer_email = ? WHERE id = ?"
        ).bind(order_id, payload.buyer_email, license.id),

        // 2. 更新订单状态
        db.prepare(
          "UPDATE orders SET status = 'PAID', trade_no = ?, license_id = ?, direct_commission = ?, indirect_commission = ?, paid_at = ? WHERE id = ?"
        ).bind(trade_no, license.id, directAmt, indirectAmt, Date.now(), order_id),

        // 3. 给一级推荐人加钱
        ...(directAmt > 0 ? [
          db.prepare(
            "UPDATE users SET wallet_balance = wallet_balance + ?, total_commission = total_commission + ? WHERE id = ?"
          ).bind(directAmt, directAmt, buyer.parent_id),
          db.prepare(
            "INSERT INTO commission_logs (id, order_id, beneficiary_id, tier, commission_amount, created_at) VALUES (?, ?, ?, 1, ?, ?)"
          ).bind(crypto.randomUUID(), order_id, buyer.parent_id, directAmt, Date.now())
        ] : []),

        // 4. 给二级推荐人加钱
        ...(indirectAmt > 0 ? [
          db.prepare(
            "UPDATE users SET wallet_balance = wallet_balance + ?, total_commission = total_commission + ? WHERE id = ?"
          ).bind(indirectAmt, indirectAmt, buyer.grandparent_id),
          db.prepare(
            "INSERT INTO commission_logs (id, order_id, beneficiary_id, tier, commission_amount, created_at) VALUES (?, ?, ?, 2, ?, ?)"
          ).bind(crypto.randomUUID(), order_id, buyer.grandparent_id, indirectAmt, Date.now())
        ] : [])
      ]);

      return new Response('success', { status: 200 });
    }

    // 2. 软件客户端在线激活 / 换绑 / 心跳校验接口
    if (url.pathname === '/api/license/verify' && request.method === 'POST') {
      const { license_key, machine_id } = await request.json();

      const license = await env.DB.prepare(
        "SELECT * FROM licenses WHERE license_key = ?"
      ).bind(license_key).first();

      if (!license) {
        return Response.json({ valid: false, message: '卡密不存在' }, { status: 404 });
      }

      if (license.status === 'BANNED' || license.status === 'REFUNDED') {
        return Response.json({ valid: false, message: '该授权已被封禁或退款注销' }, { status: 403 });
      }

      // 首次激活：绑定设备机器码
      if (!license.bound_machine_id) {
        await env.DB.prepare(
          "UPDATE licenses SET bound_machine_id = ?, activated_at = ?, last_heartbeat_at = ? WHERE id = ?"
        ).bind(machine_id, Date.now(), Date.now(), license.id);
      } else if (license.bound_machine_id !== machine_id) {
        // 机器码不匹配防盗用
        return Response.json({ valid: false, message: '设备不匹配！此卡密已绑定其他电脑，请在后台解绑' }, { status: 403 });
      } else {
        // 设备匹配，刷新最近一次心跳
        await env.DB.prepare(
          "UPDATE licenses SET last_heartbeat_at = ? WHERE id = ?"
        ).bind(Date.now(), license.id);
      }

      // 生成带有时效性的签名 Token (客户端可缓存 24 小时以支持离线运行)
      const expiresAt = license.expires_at || (Date.now() + 365 * 86400 * 1000);
      return Response.json({
        valid: true,
        license_key: license.license_key,
        plan_type: license.plan_type,
        expires_at: expiresAt,
        grace_period_hours: 72 // 允许网络断开时继续离线运行 72 小时
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};`;
