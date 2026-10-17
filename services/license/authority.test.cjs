const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {createAuthority}=require('./authority.cjs');
test('durable signing identity, binding, fixed expiry and closed administrative/payment routes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thinkai-authority-'));
 let app=createAuthority({dir});
 assert.ok(app?.server,'authority must expose a real HTTP server');
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const request=async(route,body)=>{const r=await fetch(`http://127.0.0.1:${app.server.address().port}${route}`,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,text:await r.text()};};
 try{
 const pub=(await request('/api/license/public-key')).text;
 const input={card_key:'TEST-DEV-8888-AAAA-1111',machine_id:'test-machine',nonce:crypto.randomBytes(16).toString('hex'),timestamp:Date.now()};
 const first=await request('/api/license/verify',input);assert.equal(first.status,200);
 const token=JSON.parse(first.text);const canonical=Object.keys(token.data).sort().map(k=>`${k}=${token.data[k]}`).join('&');
 assert.equal(crypto.verify('RSA-SHA256',Buffer.from(canonical),pub,Buffer.from(token.signature,'base64')),true);
 assert.equal((await request('/api/license/verify',{...input,card_key:'VIP-2026-FAKE'})).status,403);
 assert.equal((await request('/api/license/renew',{...input,machine_id:'unbound-device'})).status,403);
 assert.equal((await request('/api/license/reset',input)).status,404);
 assert.equal((await request('/api/payment/xunhupay/test-mock-callback',{})).status,503);
 await new Promise(r=>app.server.close(r));
 app=createAuthority({dir});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 assert.equal((await request('/api/license/public-key')).text,pub);
 const renewed=await request('/api/license/renew',{...input,nonce:crypto.randomBytes(16).toString('hex'),timestamp:Date.now()});
 assert.equal(renewed.status,200);assert.equal(JSON.parse(renewed.text).data.expire_time,token.data.expire_time);
 assert.equal((await request('/api/license/verify',{...input,nonce:'x&timestamp=1'})).status,400);
 }finally{await new Promise(r=>app.server.close(r));fs.rmSync(dir,{recursive:true});}
});
