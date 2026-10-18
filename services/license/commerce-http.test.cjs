const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');const{createAuthority}=require('./authority.cjs');const{passwordRecord}=require('./commerce.cjs');
test('real HTTP commerce login, agent roles and email recovery remain protected',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thinkai-commerce-http-'));const app=createAuthority({dir,commerceOptions:{admin:passwordRecord('AdminPassword-123'),mailer:{async send(){}}},paymentOptions:{credentials:{appid:'12345678',appsecret:'HTTP-COMMERCE-FAKE-SECRET'},enabled:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>app.server.close(r));fs.rmSync(dir,{recursive:true,force:true});});const base='http://127.0.0.1:'+app.server.address().port;
 const post=async(route,body,token,origin='https://thinkai.vip')=>{const response=await fetch(base+'/api/payment/commerce/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return{status:response.status,body:await response.json()};};
 const logged=await post('login',{code:'ADMIN',password:'AdminPassword-123'});assert.equal(logged.status,200);const token=logged.body.data.token;
 assert.equal((await post('agents',{code:'PARTNER',name:'渠道',password:'PartnerPassword-123'},null)).status,403);
 assert.equal((await post('agents',{code:'PARTNER',name:'渠道',password:'PartnerPassword-123'},token)).status,200);
 const partner=await post('login',{code:'PARTNER',password:'PartnerPassword-123'});assert.equal(partner.status,200);
 assert.equal((await post('agents',{code:'OTHER',name:'其他',password:'AnotherPassword-123'},partner.body.data.token)).status,403);
 assert.equal((await post('recover/request',{email:'buyer@example.com'},null,'https://evil.invalid')).status,403);
 assert.equal((await post('recover/request',{email:'buyer@example.com'})).status,200);
 const dashboard=await fetch(base+'/api/payment/commerce/dashboard',{headers:{Authorization:'Bearer '+partner.body.data.token}});assert.equal(dashboard.status,200);const data=(await dashboard.json()).data;assert.equal(data.role,'agent');assert.equal(data.agents,undefined);assert.equal(data.balance_cents,0);
 const image='data:image/png;base64,'+Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(10000)]).toString('base64');
 const payout=await post('withdraw',{amount_cents:100,payout:{method:'wechat',recipient_name:'张三',qr_image:image},idempotency_key:'http-payout-image'},partner.body.data.token);
 assert.equal(payout.status,400);
 assert.match(payout.body.message,/可提现余额不足/);
});
