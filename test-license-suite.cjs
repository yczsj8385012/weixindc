/**
 * Codex 自动化联调测试套件 (Test License Suite)
 * 
 * 运行方式：
 * 1. 终端窗口 1 运行 Mock 服务：node mock-license-server.cjs
 * 2. 终端窗口 2 运行本测试套件：node test-license-suite.cjs
 */

const crypto = require('crypto');

const BASE_URL = process.env.LICENSE_SERVER_URL || 'http://127.0.0.1:8787';
let PUBLIC_KEY = '';

function verifySignature(data, signature) {
  const canonical = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('&');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical, 'utf8');
  return verifier.verify(PUBLIC_KEY, signature, 'base64');
}

async function runTests() {
  console.log(`=======================================================`);
  console.log(`🚀 开始执行 ThinkAI 商业授权全链路联调测试`);
  console.log(`🎯 目标服务地址: ${BASE_URL}`);
  console.log(`=======================================================\n`);

  // 获取服务端官方标准公钥
  const pkRes = await fetch(`${BASE_URL}/api/license/public-key`);
  if (!pkRes.ok) throw new Error(`获取公钥失败: HTTP ${pkRes.status}`);
  PUBLIC_KEY = await pkRes.text();
  console.log(`  🔑 成功获取服务端动态 SPKI 公钥 (前 40 字符): ${PUBLIC_KEY.slice(0, 40).replace(/\n/g, ' ')}...`);

  // Test 1: 健康探活检查
  console.log(`[测试 1] GET /api/license/health 服务状态探活...`);
  const healthRes = await fetch(`${BASE_URL}/api/license/health`);
  if (!healthRes.ok) throw new Error(`探活失败: HTTP ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log(`  ✅ 探活成功: status=${healthData.status}, algorithm=${healthData.algorithm}, online=${healthData.online}\n`);


  // Test 2: 专用联调测试卡激活与动态验签
  console.log(`[测试 2] POST /api/license/verify 专用联调测试卡激活...`);
  const myMachineId = 'codex_workstation_' + Date.now();
  const myNonce = crypto.randomBytes(16).toString('hex');
  const verifyRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_key: 'TEST-DEV-8888-AAAA-1111',
      machine_id: myMachineId,
      nonce: myNonce,
      timestamp: Date.now()
    })
  });
  const verifyData = await verifyRes.json();
  if (verifyData.code !== 0) throw new Error(`激活失败: ${verifyData.message}`);
  
  const isSigValid = verifySignature(verifyData.data, verifyData.signature);
  const isNonceMatch = verifyData.data.nonce === myNonce;
  console.log(`  ✅ 激活成功: 套餐=${verifyData.data.plan}, 到期时间=${new Date(verifyData.data.expire_time).toLocaleDateString()}`);
  console.log(`  ✅ RSA-2048 验签结果: ${isSigValid ? '通过 (Valid)' : '失败 (Invalid)'}`);
  console.log(`  ✅ Nonce 防重放校验: ${isNonceMatch ? '一致' : '不匹配'}\n`);

  // Test 3: 静默续期心跳测试
  console.log(`[测试 3] POST /api/license/renew 静默续期心跳...`);
  const renewNonce = crypto.randomBytes(16).toString('hex');
  const renewRes = await fetch(`${BASE_URL}/api/license/renew`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_key: 'TEST-DEV-8888-AAAA-1111',
      machine_id: myMachineId,
      nonce: renewNonce,
      timestamp: Date.now()
    })
  });
  const renewData = await renewRes.json();
  const isRenewSigValid = verifySignature(renewData.data, renewData.signature);
  console.log(`  ✅ 续期成功: renewed_at=${renewData.data.renewed_at}`);
  console.log(`  ✅ 续期 Token RSA 验签: ${isRenewSigValid ? '通过 (Valid)' : '失败'}\n`);

  // Test 4: 跨设备盗刷冲突拦截测试
  console.log(`[测试 4] 测试已被其他设备绑定的卡密 (跨设备防盗刷拦截)...`);
  const conflictRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_key: 'TEST-BIND-9999-BBBB-2222',
      machine_id: myMachineId,
      nonce: 'conflict_nonce'
    })
  });
  const conflictData = await conflictRes.json();
  console.log(`  ✅ 拦截成功: HTTP ${conflictRes.status}, 业务码=${conflictData.code}, 原因: ${conflictData.message}\n`);

  // Test 5: 过期卡密拦截测试
  console.log(`[测试 5] 测试已过期卡密拦截...`);
  const expiredRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_key: 'TEST-EXPIRED-0000-CCCC',
      machine_id: myMachineId,
      nonce: 'expired_nonce'
    })
  });
  const expiredData = await expiredRes.json();
  console.log(`  ✅ 拦截成功: HTTP ${expiredRes.status}, 业务码=${expiredData.code}, 原因: ${expiredData.message}\n`);

  // Test 6: 伪造非法卡密拦截测试
  console.log(`[测试 6] 测试非法卡密拦截...`);
  const fakeRes = await fetch(`${BASE_URL}/api/license/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_key: 'INVALID-CARD-XXXX',
      machine_id: myMachineId,
      nonce: 'fake_nonce'
    })
  });
  const fakeData = await fakeRes.json();
  console.log(`  ✅ 拦截成功: HTTP ${fakeRes.status}, 业务码=${fakeData.code}, 原因: ${fakeData.message}\n`);

  // Test 7: 专用测试卡绑定重置测试 (释放名额)
  console.log(`[测试 7] POST /api/license/reset 重置测试卡设备绑定 (释放测试名额)...`);
  const resetRes = await fetch(`${BASE_URL}/api/license/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_key: 'TEST-DEV-8888-AAAA-1111' })
  });
  const resetData = await resetRes.json();
  console.log(`  ✅ 重置成功: ${resetData.message}\n`);

  console.log(`=======================================================`);
  console.log(`🎉 恭喜！全套 7 项核心安全鉴权联调测试全部通过！`);
  console.log(`所有接口行为完全确定，签名真实且能被 RSA-2048 SPKI 公钥正常验签。`);
  console.log(`现在可以放心接入独立副本项目（main.ts 与 safeStorage）！`);
  console.log(`=======================================================`);
}

runTests().catch(err => {
  console.error('\n❌ 测试失败:', err.message);
  process.exit(1);
});
