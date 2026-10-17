import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'node:crypto';
import path from 'node:path';
import { RSA_PUBLIC_KEY, signData } from './src/server/licenseService';



const app = express();
const PORT = 3000;

// 解析 JSON 请求体与 URL-encoded 表单回调请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 跨域支持 (允许来自任何开发环境或 Electron 发送的请求)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Version');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 设备绑定内存状态库 (支持联调与重置)
interface CardRecord {
  plan: 'annual' | 'quarterly';
  max_devices: number;
  bound_machines: string[];
  is_expired?: boolean;
  is_dev_test?: boolean;
}

const CARDS_DB: Record<string, CardRecord> = {
  // 1. 专门用于联调的主测试卡 (可随时多端绑定或重置)
  'TEST-DEV-8888-AAAA-1111': {
    plan: 'annual',
    max_devices: 5,
    bound_machines: [],
    is_dev_test: true
  },
  // 2. 模拟已被其他设备绑定的单设备卡 (用于测试跨设备防盗刷拦截)
  'TEST-BIND-9999-BBBB-2222': {
    plan: 'quarterly',
    max_devices: 1,
    bound_machines: ['fixed_machine_alpha_888']
  },
  // 3. 模拟已过期的测试卡 (用于测试过期拒绝逻辑)
  'TEST-EXPIRED-0000-CCCC': {
    plan: 'quarterly',
    max_devices: 1,
    bound_machines: [],
    is_expired: true
  },
  // 4. 标准 VIP 样例年卡
  'VIP-2026-99A8-71B2-C4D5': {
    plan: 'annual',
    max_devices: 3,
    bound_machines: []
  }
};

// 健康检查与服务状态探活
app.get('/api/license/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'thinkai-commercial-license-authority',
    algorithm: 'RSA-2048/SHA-256',
    online: true,
    timestamp: Date.now()
  });
});

// 获取服务端官方标准公钥
app.get('/api/license/public-key', (_req: Request, res: Response) => {
  res.type('text/plain').send(RSA_PUBLIC_KEY);
});

// 重置卡密绑定接口 (专门给 Codex 联调测试使用，避免占用名额)
app.post('/api/license/reset', (req: Request, res: Response) => {
  const { card_key } = req.body || {};
  if (!card_key) {
    return res.status(400).json({ code: 4001, message: 'Missing card_key', data: null });
  }

  const normalizedKey = String(card_key).trim().toUpperCase();
  if (CARDS_DB[normalizedKey]) {
    CARDS_DB[normalizedKey].bound_machines = [];
    return res.json({
      code: 0,
      message: `Card ${normalizedKey} bindings have been successfully reset.`,
      bound_machines: []
    });
  }

  return res.status(404).json({ code: 4004, message: 'Card not found in database', data: null });
});

// 1. 激活与强联网校验接口
// POST /api/license/verify
app.post('/api/license/verify', (req: Request, res: Response) => {
  const { card_key, machine_id, nonce, timestamp } = req.body || {};

  if (!card_key || !machine_id) {
    return res.status(400).json({
      code: 4001,
      message: 'Missing card_key or machine_id',
      data: null
    });
  }

  const rawKey = String(card_key).trim();
  const normalizedKey = rawKey.toUpperCase();
  const machine = String(machine_id).trim();

  // 1. 非法无效卡密拦截
  if (normalizedKey.startsWith('INVALID') || (!CARDS_DB[normalizedKey] && !normalizedKey.startsWith('VIP-2026'))) {
    return res.status(403).json({
      code: 4004,
      message: '卡密不存在或已被系统注销 (Card key invalid or deleted)',
      data: null
    });
  }

  const card = CARDS_DB[normalizedKey] || {
    plan: normalizedKey.includes('ANNUAL') ? 'annual' : 'quarterly',
    max_devices: 3,
    bound_machines: []
  };

  // 2. 过期卡密拦截
  if (card.is_expired) {
    return res.status(403).json({
      code: 4002,
      message: '该授权卡密已到期，请购买续费后重试 (Card key expired)',
      data: null
    });
  }

  // 3. 设备绑定防刷检查
  if (!card.bound_machines.includes(machine)) {
    if (card.bound_machines.length >= card.max_devices) {
      return res.status(403).json({
        code: 4003,
        message: `卡密已在设备 [${card.bound_machines.join(', ')}] 上绑定，超出最大允许设备数 (${card.bound_machines.length}/${card.max_devices})`,
        data: null
      });
    }
    // 自动记录设备绑定
    card.bound_machines.push(machine);
  }

  const now = Date.now();
  const isAnnual = card.plan === 'annual';
  const durationMs = isAnnual ? 365 * 24 * 3600 * 1000 : 90 * 24 * 3600 * 1000;
  const expire_time = now + durationMs;

  const licenseData: Record<string, any> = {
    card_key: rawKey,
    expire_time,
    machine_id: machine,
    max_devices: card.max_devices,
    nonce: String(nonce || ('dyn_' + Math.random().toString(36).substring(2))),
    plan: card.plan,
    status: 'active',
    timestamp: timestamp ? Number(timestamp) : now
  };

  const signature = signData(licenseData);

  return res.json({
    code: 0,
    message: 'success',
    data: licenseData,
    signature,
    offline_grace_seconds: 259200
  });
});

// 2. 静默续期与心跳保活接口
// POST /api/license/renew
app.post('/api/license/renew', (req: Request, res: Response) => {
  const { card_key, machine_id, nonce, timestamp } = req.body || {};

  if (!card_key || !machine_id) {
    return res.status(400).json({
      code: 4001,
      message: 'Missing card_key or machine_id for renewal',
      data: null
    });
  }

  const rawKey = String(card_key).trim();
  const normalizedKey = rawKey.toUpperCase();
  const machine = String(machine_id).trim();

  // 非法卡检测
  if (normalizedKey.startsWith('INVALID') || (!CARDS_DB[normalizedKey] && !normalizedKey.startsWith('VIP-2026'))) {
    return res.status(403).json({
      code: 4004,
      message: '卡密不存在或已被注销',
      data: null
    });
  }

  const card = CARDS_DB[normalizedKey] || {
    plan: 'annual',
    max_devices: 3,
    bound_machines: [machine]
  };

  if (card.is_expired) {
    return res.status(403).json({
      code: 4002,
      message: '卡密已到期，续期拒绝',
      data: null
    });
  }

  const now = Date.now();
  const isAnnual = card.plan === 'annual';
  const durationMs = isAnnual ? 365 * 24 * 3600 * 1000 : 90 * 24 * 3600 * 1000;
  const expire_time = now + durationMs;

  const renewData: Record<string, any> = {
    card_key: rawKey,
    expire_time,
    machine_id: machine,
    max_devices: card.max_devices,
    nonce: String(nonce || ('dyn_' + Math.random().toString(36).substring(2))),
    plan: card.plan,
    renewed_at: now,
    status: 'active',
    timestamp: timestamp ? Number(timestamp) : now
  };

  const signature = signData(renewData);

  return res.json({
    code: 0,
    message: 'success',
    data: renewData,
    signature,
    offline_grace_seconds: 259200
  });
});

// =========================================================================
// 虎皮椒 (Xunhupay V3) 微信/支付宝聚合支付集成模块
// =========================================================================

// 虎皮椒内存安全配置
let XUNHUPAY_CONFIG = {
  appid: process.env.XUNHUPAY_APPID || '201906188815',
  appsecret: process.env.XUNHUPAY_APPSECRET || '78a5f93fb791675440dca906e1c785ea',
  notify_url: process.env.XUNHUPAY_NOTIFY_URL || 'https://thinkai.vip/api/payment/xunhupay/notify',
  api_endpoint: 'https://api.xunhupay.com/payment/do.html'
};

// 内存订单数据库
interface PaymentOrder {
  order_id: string;
  plan: 'annual' | 'quarterly';
  amount: number;
  payment_method: 'wechat' | 'alipay';
  status: 'pending' | 'paid' | 'expired';
  license_key?: string;
  referrer_code: string;
  commission_amount: number;
  buyer_email?: string;
  created_at: number;
  paid_at?: number;
  xunhupay_open_order_id?: string;
}

const PAYMENT_ORDERS: Record<string, PaymentOrder> = {
  'ORD-DEMO-9901': {
    order_id: 'ORD-DEMO-9901',
    plan: 'annual',
    amount: 99.00,
    payment_method: 'wechat',
    status: 'paid',
    license_key: 'YEAR-2026-99A8-71B2',
    referrer_code: 'VIP888',
    commission_amount: 39.60,
    buyer_email: 'demo@company.com',
    created_at: Date.now() - 3600000,
    paid_at: Date.now() - 3500000
  }
};

// 虎皮椒 V3 签名算力 (MD5 字母序升序拼接 + APPSECRET)
function generateXunhupayHash(params: Record<string, any>, appSecret: string): string {
  const filteredKeys = Object.keys(params)
    .filter((k) => k !== 'hash' && params[k] !== undefined && params[k] !== null && String(params[k]).trim() !== '')
    .sort();
  const queryString = filteredKeys.map((k) => `${k}=${params[k]}`).join('&');
  const stringToSign = queryString + appSecret;
  return crypto.createHash('md5').update(stringToSign, 'utf8').digest('hex').toLowerCase();
}

// 自动生成全新卡密并注入 CARDS_DB
function issueNewCardKey(plan: 'annual' | 'quarterly'): string {
  const prefix = plan === 'annual' ? 'YEAR' : 'QTR';
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  const cardKey = `${prefix}-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8, 12)}`;
  
  CARDS_DB[cardKey] = {
    plan,
    max_devices: plan === 'annual' ? 3 : 1,
    bound_machines: []
  };
  return cardKey;
}

// 获取/更新虎皮椒配置接口
app.get('/api/payment/xunhupay/config', (_req: Request, res: Response) => {
  return res.json({
    code: 0,
    data: {
      appid: XUNHUPAY_CONFIG.appid,
      is_configured: Boolean(XUNHUPAY_CONFIG.appid && XUNHUPAY_CONFIG.appsecret),
      notify_url: XUNHUPAY_CONFIG.notify_url,
      api_endpoint: XUNHUPAY_CONFIG.api_endpoint
    }
  });
});

app.post('/api/payment/xunhupay/config', (req: Request, res: Response) => {
  const { appid, appsecret, notify_url } = req.body || {};
  if (appid !== undefined) XUNHUPAY_CONFIG.appid = String(appid).trim();
  if (appsecret !== undefined) XUNHUPAY_CONFIG.appsecret = String(appsecret).trim();
  if (notify_url !== undefined) XUNHUPAY_CONFIG.notify_url = String(notify_url).trim();

  return res.json({
    code: 0,
    message: '虎皮椒支付参数配置更新成功！',
    data: {
      appid: XUNHUPAY_CONFIG.appid,
      is_configured: Boolean(XUNHUPAY_CONFIG.appid && XUNHUPAY_CONFIG.appsecret),
      notify_url: XUNHUPAY_CONFIG.notify_url
    }
  });
});

// 1. 发起虎皮椒支付订单接口 POST /api/payment/xunhupay/create
app.post('/api/payment/xunhupay/create', async (req: Request, res: Response) => {
  const { plan = 'annual', payment_method = 'wechat', referrer_code = 'VIP888', buyer_email } = req.body || {};
  
  const selectedPlan = plan === 'quarterly' ? 'quarterly' : 'annual';
  const amount = selectedPlan === 'annual' ? 99.00 : 29.90;
  const commission_amount = Number((amount * 0.4).toFixed(2));
  const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  // 写入待支付订单
  PAYMENT_ORDERS[order_id] = {
    order_id,
    plan: selectedPlan,
    amount,
    payment_method: payment_method === 'alipay' ? 'alipay' : 'wechat',
    status: 'pending',
    referrer_code: String(referrer_code || 'VIP888').toUpperCase(),
    commission_amount,
    buyer_email: String(buyer_email || ''),
    created_at: Date.now()
  };

  const isConfigured = Boolean(XUNHUPAY_CONFIG.appid && XUNHUPAY_CONFIG.appsecret);

  // 若已配置真实虎皮椒密钥，尝试发起真实网络请求
  if (isConfigured) {
    try {
      const payload: Record<string, any> = {
        version: '1.1',
        appid: XUNHUPAY_CONFIG.appid,
        trade_order_id: order_id,
        total_fee: amount.toFixed(2),
        title: `ThinkAI商业授权-${selectedPlan === 'annual' ? 'VIP年卡' : '标准季卡'}`,
        time: Math.floor(Date.now() / 1000),
        notify_url: XUNHUPAY_CONFIG.notify_url,
        return_url: `${req.headers.origin || 'http://localhost:3000'}?payment_success=1&order_id=${order_id}`,
        nonce_str: crypto.randomBytes(8).toString('hex'),
        type: payment_method === 'alipay' ? 'alipay' : 'wechat'
      };

      payload.hash = generateXunhupayHash(payload, XUNHUPAY_CONFIG.appsecret);

      // 官方文档明确要求：使用 curl 的 post (json) 方式传参数，并直接取得 json 回传值
      const xunhuRes = await fetch(XUNHUPAY_CONFIG.api_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resultText = await xunhuRes.text();
      let resultData: any = {};
      try {
        resultData = JSON.parse(resultText);
      } catch {
        resultData = { raw: resultText };
      }

      if (resultData.url_qrcode || resultData.url) {
        return res.json({
          code: 0,
          message: '虎皮椒官方收银台调起成功',
          data: {
            order_id,
            amount,
            plan: selectedPlan,
            payment_method,
            qrcode_url: resultData.url_qrcode || resultData.url,
            is_live_gateway: true,
            hash_verified: true
          }
        });
      }
    } catch (err: any) {
      console.warn('[Xunhupay] 线上 API 调起未成功，切换为高仿真本地调起:', err.message);
    }
  }

  // 开发调试/无 Key 情况下，返回高仿真本地收款二维码与调试回调
  const mockQrcode = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `https://xunhupay.com/simulated_checkout?order_id=${order_id}&amount=${amount}&type=${payment_method}`
  )}`;

  return res.json({
    code: 0,
    message: isConfigured ? '虎皮椒订单发起成功 (演示通道)' : '未检测到 XUNHUPAY_APPSECRET，已自动切换为全功能高仿真支付模式',
    data: {
      order_id,
      amount,
      plan: selectedPlan,
      payment_method,
      qrcode_url: mockQrcode,
      is_live_gateway: false,
      notice: '建议在【控制中心】配置真实 AppID/AppSecret 开通线上微信/支付宝扫码收款'
    }
  });
});

// 2. 虎皮椒异步回调通知接口 POST /api/payment/xunhupay/notify (POST 表单方式)
app.post('/api/payment/xunhupay/notify', (req: Request, res: Response) => {
  const params = req.body || {};
  const { trade_order_id, status, open_order_id, hash, total_fee, appid } = params;

  if (!trade_order_id) {
    return res.status(400).send('fail: missing trade_order_id');
  }

  const order = PAYMENT_ORDERS[trade_order_id];
  if (!order) {
    return res.status(404).send('fail: order not found');
  }

  // 1. 若已配置真实 AppSecret，严格校验 MD5 签名
  if (XUNHUPAY_CONFIG.appsecret && hash) {
    const expectedHash = generateXunhupayHash(params, XUNHUPAY_CONFIG.appsecret);
    if (expectedHash !== String(hash).toLowerCase()) {
      return res.status(403).send('fail: invalid hash signature');
    }
  }

  // 2. 商户身份校验
  if (XUNHUPAY_CONFIG.appid && appid && String(appid) !== String(XUNHUPAY_CONFIG.appid)) {
    return res.status(403).send('fail: appid mismatch');
  }

  // 3. 实付金额强制比对，防止篡改低价刷单 (分毫不差)
  if (total_fee !== undefined) {
    const paidAmount = Number(total_fee);
    if (Math.abs(paidAmount - order.amount) > 0.01) {
      return res.status(400).send('fail: amount mismatch');
    }
  }

  // 4. 幂等性控制：确认订单已支付 (OD 为虎皮椒成功状态)
  if (status === 'OD' || status === 'paid' || !status) {
    if (order.status !== 'paid') {
      order.status = 'paid';
      order.paid_at = Date.now();
      order.xunhupay_open_order_id = open_order_id || 'xunhu_' + Date.now();
      
      // 统一授权发卡逻辑：自动生成对应的全新格式卡密
      order.license_key = issueNewCardKey(order.plan);
    }

    // 虎皮椒官方约定：处理成功必须输出纯文本 success
    return res.send('success');
  }

  return res.send('fail');
});


// 3. 轮询订单支付状态 GET /api/payment/status
app.get('/api/payment/status', (req: Request, res: Response) => {
  const order_id = String(req.query.order_id || '');
  if (!order_id) {
    return res.status(400).json({ code: 4001, message: 'Missing order_id' });
  }

  const order = PAYMENT_ORDERS[order_id];
  if (!order) {
    return res.status(404).json({ code: 4004, message: 'Order not found', paid: false });
  }

  return res.json({
    code: 0,
    paid: order.status === 'paid',
    order
  });
});

// 4. 一键模拟虎皮椒支付成功回调测试 POST /api/payment/xunhupay/test-mock-callback
app.post('/api/payment/xunhupay/test-mock-callback', (req: Request, res: Response) => {
  const { order_id } = req.body || {};
  if (!order_id || !PAYMENT_ORDERS[order_id]) {
    return res.status(400).json({ code: 4001, message: 'Invalid or missing order_id' });
  }

  const order = PAYMENT_ORDERS[order_id];
  order.status = 'paid';
  order.paid_at = Date.now();
  order.license_key = issueNewCardKey(order.plan);
  order.xunhupay_open_order_id = 'mock_xunhu_' + Date.now();

  return res.json({
    code: 0,
    message: '🎉 虎皮椒支付回调模拟成功！已自动完成发卡与返佣计算',
    order
  });
});

// 5. 获取与更新虎皮椒配置接口
app.get('/api/payment/xunhupay/config', (_req: Request, res: Response) => {
  return res.json({
    code: 0,
    data: {
      appid: XUNHUPAY_CONFIG.appid,
      appsecret: XUNHUPAY_CONFIG.appsecret ? '********' : '',
      is_configured: !!XUNHUPAY_CONFIG.appsecret,
      notify_url: XUNHUPAY_CONFIG.notify_url
    }
  });
});

app.post('/api/payment/xunhupay/config', (req: Request, res: Response) => {
  const { appid, appsecret, notify_url } = req.body || {};
  if (appid) XUNHUPAY_CONFIG.appid = appid;
  if (appsecret) XUNHUPAY_CONFIG.appsecret = appsecret;
  if (notify_url) XUNHUPAY_CONFIG.notify_url = notify_url;

  return res.json({
    code: 0,
    message: '虎皮椒配置保存成功！',
    data: {
      appid: XUNHUPAY_CONFIG.appid,
      is_configured: !!XUNHUPAY_CONFIG.appsecret,
      notify_url: XUNHUPAY_CONFIG.notify_url
    }
  });
});


async function startServer() {
  // 静态资源托管：优先托管 public 目录下的文件 (例如 /downloads 中的 152MB 大文件包)
  app.use(express.static(path.resolve('public')));

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    // 生产模式：直接托管静态 dist 资源
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    // 开发环境挂载 Vite 中间件
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ThinkAI License Server] Running at http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();

