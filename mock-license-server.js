/**
 * ThinkAI 官方商业授权 - 本地独立联调模拟服务 (Stand-alone Mock License Server)
 * 
 * 用途：
 * 供客户端工程师 (Codex) 在本地零网络延迟、免依赖运行，进行 100% 真实签名校验与业务测试。
 * 包含：真实 RSA-2048 私钥签名、健康探活、设备绑定、防盗刷拦截、过期拦截、卡密重置接口。
 * 
 * 启动方式：
 *   node mock-license-server.js
 *   默认监听端口：8787 (http://127.0.0.1:8787)
 */

const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8787;

/// 1. 动态生成 RSA-2048 密钥对 (彻底消除硬编码私钥泄露风险)
function initKeys() {
  const envPrivate = process.env.RSA_PRIVATE_KEY;
  if (envPrivate && envPrivate.trim().length > 0) {
    try {
      const prvKey = crypto.createPrivateKey(envPrivate);
      const pubKey = crypto.createPublicKey(prvKey);
      return {
        privateKey: prvKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
        publicKey: pubKey.export({ type: 'spki', format: 'pem' }).toString()
      };
    } catch (e) {
      console.warn('[MockServer] 环境变量 RSA_PRIVATE_KEY 解析失败，将使用动态生成的随机密钥对');
    }
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { privateKey, publicKey };
}

const KEYS = initKeys();
const RSA_PUBLIC_KEY = KEYS.publicKey;
const RSA_PRIVATE_KEY = KEYS.privateKey;


// 2. 规范化参数字典序生成签名
function canonicalString(data) {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('&');
}

function signData(data) {
  const canonical = canonicalString(data);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical, 'utf8');
  return signer.sign(RSA_PRIVATE_KEY, 'base64');
}

// 3. 测试卡密字典 (预设了各场景测试卡)
const CARDS_DB = {
  // A. 专用于 Codex 联调的主测试卡 (可随时多端绑定，可调用 /reset 随时重置)
  'TEST-DEV-8888-AAAA-1111': {
    plan: 'annual',
    max_devices: 5,
    bound_machines: [],
    is_dev_test: true
  },
  // B. 预绑定其他设备的单设备卡 (用于测试跨设备防盗刷拦截)
  'TEST-BIND-9999-BBBB-2222': {
    plan: 'quarterly',
    max_devices: 1,
    bound_machines: ['fixed_machine_alpha_888']
  },
  // C. 模拟过期卡 (用于测试过期拦截)
  'TEST-EXPIRED-0000-CCCC': {
    plan: 'quarterly',
    max_devices: 1,
    bound_machines: [],
    is_expired: true
  },
  // D. 标准 VIP 年卡示例
  'VIP-2026-99A8-71B2-C4D5': {
    plan: 'annual',
    max_devices: 3,
    bound_machines: []
  }
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // 处理跨域预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. 探活接口 GET /api/license/health
  if (req.method === 'GET' && pathname === '/api/license/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'thinkai-commercial-license-authority',
      algorithm: 'RSA-2048/SHA-256',
      online: true,
      timestamp: Date.now(),
      mode: 'mock-standalone-server',
      note: 'Dedicated local authority server for Codex testing'
    });
  }

  // 2. 获取公钥 GET /api/license/public-key
  if (req.method === 'GET' && pathname === '/api/license/public-key') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(RSA_PUBLIC_KEY);
  }

  // 收集 POST Body
  if (req.method === 'POST') {
    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', () => {
      let body = {};
      try {
        if (rawBody) body = JSON.parse(rawBody);
      } catch (e) {
        return sendJson(res, 400, { code: 4000, message: 'Invalid JSON body', data: null });
      }

      // 3. 卡密重置接口 POST /api/license/reset
      if (pathname === '/api/license/reset') {
        const { card_key } = body;
        if (!card_key) return sendJson(res, 400, { code: 4001, message: 'Missing card_key', data: null });
        const key = String(card_key).trim().toUpperCase();
        if (CARDS_DB[key]) {
          CARDS_DB[key].bound_machines = [];
          console.log(`[RESET] Card ${key} bindings cleared.`);
          return sendJson(res, 200, {
            code: 0,
            message: `Card ${key} device bindings have been reset to empty.`,
            bound_machines: []
          });
        }
        return sendJson(res, 404, { code: 4004, message: 'Card not found in database', data: null });
      }

      // 4. 激活接口 POST /api/license/verify
      if (pathname === '/api/license/verify') {
        const { card_key, machine_id, nonce, timestamp } = body;
        if (!card_key || !machine_id) {
          return sendJson(res, 400, { code: 4001, message: 'Missing card_key or machine_id', data: null });
        }

        const rawKey = String(card_key).trim();
        const key = rawKey.toUpperCase();
        const machine = String(machine_id).trim();

        // 非法卡拦截
        if (key.startsWith('INVALID') || (!CARDS_DB[key] && !key.startsWith('VIP-2026'))) {
          console.log(`[VERIFY-REJECT] Invalid card: ${key}`);
          return sendJson(res, 403, { code: 4004, message: '卡密不存在或已被注销 (Card invalid)', data: null });
        }

        const card = CARDS_DB[key] || {
          plan: key.includes('ANNUAL') ? 'annual' : 'quarterly',
          max_devices: 3,
          bound_machines: []
        };

        // 过期拦截
        if (card.is_expired) {
          console.log(`[VERIFY-REJECT] Expired card: ${key}`);
          return sendJson(res, 403, { code: 4002, message: '卡密已到期 (Card expired)', data: null });
        }

        // 设备绑定与超出限制拦截
        if (!card.bound_machines.includes(machine)) {
          if (card.bound_machines.length >= card.max_devices) {
            console.log(`[VERIFY-REJECT] Device limit reached for card: ${key}`);
            return sendJson(res, 403, {
              code: 4003,
              message: `卡密已在设备 [${card.bound_machines.join(', ')}] 上激活，超出限制 (${card.bound_machines.length}/${card.max_devices})`,
              data: null
            });
          }
          card.bound_machines.push(machine);
        }

        const now = Date.now();
        const isAnnual = card.plan === 'annual';
        const durationMs = isAnnual ? 365 * 24 * 3600 * 1000 : 90 * 24 * 3600 * 1000;
        const expire_time = now + durationMs;

        const licenseData = {
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
        console.log(`[VERIFY-OK] Card: ${key}, Machine: ${machine}, Signed with RSA-2048`);

        return sendJson(res, 200, {
          code: 0,
          message: 'success',
          data: licenseData,
          signature,
          offline_grace_seconds: 259200
        });
      }

      // 5. 续期接口 POST /api/license/renew
      if (pathname === '/api/license/renew') {
        const { card_key, machine_id, nonce, timestamp } = body;
        if (!card_key || !machine_id) {
          return sendJson(res, 400, { code: 4001, message: 'Missing card_key or machine_id', data: null });
        }

        const rawKey = String(card_key).trim();
        const key = rawKey.toUpperCase();
        const machine = String(machine_id).trim();

        if (key.startsWith('INVALID') || (!CARDS_DB[key] && !key.startsWith('VIP-2026'))) {
          return sendJson(res, 403, { code: 4004, message: '卡密不存在或已被注销', data: null });
        }

        const card = CARDS_DB[key] || {
          plan: 'annual',
          max_devices: 3,
          bound_machines: [machine]
        };

        if (card.is_expired) {
          return sendJson(res, 403, { code: 4002, message: '卡密已到期', data: null });
        }

        const now = Date.now();
        const isAnnual = card.plan === 'annual';
        const durationMs = isAnnual ? 365 * 24 * 3600 * 1000 : 90 * 24 * 3600 * 1000;
        const expire_time = now + durationMs;

        const renewData = {
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
        console.log(`[RENEW-OK] Card: ${key}, Machine: ${machine}, Signed with RSA-2048`);

        return sendJson(res, 200, {
          code: 0,
          message: 'success',
          data: renewData,
          signature,
          offline_grace_seconds: 259200
        });
      }

      return sendJson(res, 404, { code: 404, message: 'Endpoint not found', data: null });
    });
    return;
  }

  // 兜底 404
  sendJson(res, 404, { code: 404, message: 'Route not found', data: null });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`ThinkAI License Mock Authority Server running at:`);
  console.log(`  http://127.0.0.1:${PORT}`);
  console.log(`Endpoints available:`);
  console.log(`  GET  /api/license/health   (200 OK Status)`);
  console.log(`  GET  /api/license/public-key`);
  console.log(`  POST /api/license/verify   (Activation & RSA Signing)`);
  console.log(`  POST /api/license/renew    (Silent Renewal)`);
  console.log(`  POST /api/license/reset    (Clear Device Bindings)`);
  console.log(`=======================================================`);
});
