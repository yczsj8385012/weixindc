const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {openStateStore}=require('./state-store.cjs');const {createPaymentService}=require('./payment-service.cjs');const {signFields}=require('./xunhupay.cjs');
let api={};try{api=require('./commerce.cjs');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
function fixture(t){assert.equal(typeof api.createCommerce,'function','persistent email/recovery/affiliate service must exist');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thinkai-commerce-'));const store=openStateStore({dir});t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});let now=1800000000000;const sent=[];const mailer={async send(message){sent.push(message);}};
 const commerce=api.createCommerce({store,admin:api.passwordRecord('AdminPassword-123'),mailer,now:()=>now});const payments=createPaymentService({store,commerce,enabled:true,publicEnabled:true,appid:'12345678',secret:'LOCAL-PAYMENT-SECRET',allowedMethods:['wechat'],now:()=>now,gateway:{async createOrder(){return{checkout_url:'https://example.invalid/pay'};}}});
 return{dir,store,commerce,payments,sent,advance:ms=>{now+=ms;}};}
function input(n=1){return{plan:'quarterly',payment_method:'wechat',idempotency_key:'commerce-test-key-'+n,buyer_email:'buyer@example.com',referrer_code:'AGENT_A'};}
function notice(id,status='OD'){const f={appid:'12345678',trade_order_id:id,total_fee:'29.90',status,transaction_id:'WX_'+id,open_order_id:'XH_'+id,time:'1800000000',nonce_str:'commerce-notification'};return{...f,hash:signFields(f,'LOCAL-PAYMENT-SECRET')};}
function agent(c){const admin=c.login({code:'ADMIN',password:'AdminPassword-123'});c.createAgent(admin.token,{code:'AGENT_A',name:'合作伙伴A',password:'PartnerPassword-123'});return{admin,partner:c.login({code:'AGENT_A',password:'PartnerPassword-123'})};}
test('paid order atomically queues one delivery and1196cent commission; duplicate callback cannot issue or credit twice',async t=>{
 const{store,commerce,payments,sent}=fixture(t);const {partner}=agent(commerce);const created=await payments.createOrder(input());payments.notify(notice(created.order_id));payments.notify(notice(created.order_id));
 const dashboard=commerce.dashboard(partner.token);assert.equal(dashboard.balance_cents,1196);assert.equal(dashboard.orders.length,1);assert.equal(dashboard.orders[0].license_key,undefined);assert.equal(dashboard.orders[0].buyer_email,undefined);
 assert.equal(Object.values(store.snapshot().commerce.jobs).filter(j=>j.kind==='delivery').length,1);await commerce.drainMail();assert.equal(sent.length,1);assert.match(sent[0].text,/29\.90/);assert.match(sent[0].text,/QTR-/);assert.ok(sent[0].text.includes(created.access_token));
 await commerce.drainMail();assert.equal(sent.length,1);
});
test('refund reverses commission, prevents overbooking, but preserves transfers already completed before recording',async t=>{
 const{commerce,payments}=fixture(t);const{admin,partner}=agent(commerce);const created=await payments.createOrder(input());payments.notify(notice(created.order_id));
 const withdrawal=commerce.withdraw(partner.token,{amount_cents:1196,account:'本人微信收款账户',idempotency_key:'withdrawal-key-1'});assert.equal(commerce.withdraw(partner.token,{amount_cents:1196,account:'本人微信收款账户',idempotency_key:'withdrawal-key-1'}).id,withdrawal.id);
 assert.throws(()=>commerce.withdraw(partner.token,{amount_cents:1,account:'账号',idempotency_key:'withdrawal-key-2'}));payments.notify(notice(created.order_id,'CD'));assert.equal(commerce.dashboard(partner.token).earned_cents,0);commerce.settle(admin.token,{id:withdrawal.id,action:'paid',reference:'管理员确认已线下付款的转账号'});assert.equal(commerce.dashboard(partner.token).balance_cents,-1196);assert.equal(commerce.dashboard(partner.token).withdrawn_cents,1196);assert.throws(()=>commerce.withdraw(partner.token,{amount_cents:1,account:'账号',idempotency_key:'withdrawal-key-3'}));
});
test('wechat withdrawal keeps its private collection image visible only to its agent and admin',async t=>{
 const{commerce,payments}=fixture(t);const{admin,partner}=agent(commerce);
 commerce.createAgent(admin.token,{code:'AGENT_B',name:'合作伙伴B',password:'AnotherPassword-123'});
 const other=commerce.login({code:'AGENT_B',password:'AnotherPassword-123'});
 const created=await payments.createOrder(input());payments.notify(notice(created.order_id));
 const qr='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rYQAAAAASUVORK5CYII=';
 const request={amount_cents:100,payout:{method:'wechat',recipient_name:'张三',wechat_contact:'wxid_partner',qr_image:qr},idempotency_key:'wechat-payout-20261018'};
 const withdrawal=commerce.withdraw(partner.token,request);
 assert.equal(withdrawal.account,'微信收款码｜收款人：张三｜微信号（仅联系）：wxid_partner');
 assert.equal(withdrawal.payout.qr_image,qr);
 assert.equal(commerce.dashboard(admin.token).withdrawals[0].payout.qr_image,qr);
 assert.equal(commerce.dashboard(partner.token).withdrawals[0].payout.qr_image,qr);
 assert.equal(commerce.dashboard(other.token).withdrawals.length,0);
 assert.equal(commerce.withdraw(partner.token,request).id,withdrawal.id);
 assert.throws(()=>commerce.withdraw(partner.token,{...request,payout:{...request.payout,recipient_name:'李四'}}),/重复请求参数不同/);
});
test('payout details reject missing collection image and unusable bank or Alipay accounts',async t=>{
 const{commerce,payments}=fixture(t);const{partner}=agent(commerce);
 const created=await payments.createOrder(input());payments.notify(notice(created.order_id));
 const base={amount_cents:100,idempotency_key:'payout-validation-20261018'};
 assert.throws(()=>commerce.withdraw(partner.token,{...base,payout:{method:'wechat',recipient_name:'张三',wechat_contact:'wxid_only'}}),/收款码/);
 assert.throws(()=>commerce.withdraw(partner.token,{...base,payout:{method:'wechat',recipient_name:'张三',qr_image:'data:image/svg+xml;base64,PHN2Zz4='}}),/收款码/);
 assert.throws(()=>commerce.withdraw(partner.token,{...base,payout:{method:'bank',recipient_name:'李四',account:'6222 0000 0000 0000',bank_name:' '}}),/开户行/);
 assert.throws(()=>commerce.withdraw(partner.token,{...base,payout:{method:'bank',recipient_name:'李四',account:'not-a-card',bank_name:'中国银行上海分行'}}),/银行卡号/);
 const alipay=commerce.withdraw(partner.token,{...base,payout:{method:'alipay',recipient_name:'王五',account:'user@example.com'}});
 assert.equal(alipay.account,'支付宝｜收款人：王五｜收款账号：user@example.com');
 assert.equal(alipay.payout.account,'user@example.com');
});
test('a corrected recipient queued during an in-flight send remains pending until its own generation is sent',async t=>{
 const{store,commerce,payments}=fixture(t);const{admin}=agent(commerce);const created=await payments.createOrder(input());payments.notify(notice(created.order_id));let release;const sent=[];let first=true;
 const sender=api.createCommerce({store,mailer:{async send(message){sent.push(message);if(first){first=false;await new Promise(r=>{release=r;});}}},now:()=>1800000000000});
 const pending=sender.drainMail();commerce.adminDelivery(admin.token,{order_id:created.order_id,email:'correct@example.com'});release();await pending;
 assert.equal(store.snapshot().commerce.jobs['delivery:'+created.order_id].status,'pending');await sender.drainMail();assert.deepEqual(sent.map(m=>m.to),['buyer@example.com','correct@example.com']);assert.notEqual(sent[0].messageId,sent[1].messageId);
});
test('public webpage checkout does not require email or a configured mail provider',async t=>{
 const{store}=fixture(t);const commerce=api.createCommerce({store});const payments=createPaymentService({store,commerce,enabled:true,publicEnabled:true,appid:'12345678',secret:'LOCAL-PAYMENT-SECRET',allowedMethods:['wechat'],gateway:{async createOrder(){return{checkout_url:'https://example.invalid/pay'};}}});
 assert.equal(payments.availability().enabled,true);const created=await payments.createOrder({...input(),buyer_email:'',referrer_code:''});payments.notify(notice(created.order_id));assert.match(payments.getOrder(created.order_id,created.access_token).license_key,/^QTR-/);
});
test('email recovery requires an expiring single-use code, survives service reopen, and does not expose an email order list unauthenticated',async t=>{
 const{store,commerce,payments,sent,advance}=fixture(t);agent(commerce);const created=await payments.createOrder(input());payments.notify(notice(created.order_id));await commerce.drainMail();
 const challenge=commerce.requestRecovery('BUYER@example.com');assert.equal(challenge.orders,undefined);await commerce.drainMail();const code=sent.at(-1).text.match(/验证码：(\d{6})/)[1];
 assert.throws(()=>commerce.verifyRecovery({challenge_id:challenge.challenge_id,code:'invalid'}));const reopened=api.createCommerce({store,mailer:{async send(){}},now:()=>1800000000000});const recovered=reopened.verifyRecovery({challenge_id:challenge.challenge_id,code});assert.equal(recovered.orders[0].access_token,created.access_token);assert.throws(()=>reopened.verifyRecovery({challenge_id:challenge.challenge_id,code}));
 advance(61000);const expired=commerce.requestRecovery('buyer@example.com');advance(601000);assert.throws(()=>commerce.verifyRecovery({challenge_id:expired.challenge_id,code}));
});
test('mail failures remain durable and retry without changing paid status or issuing again; refunded cards are never mailed',async t=>{
 const{store,commerce,payments,sent,advance}=fixture(t);agent(commerce);const created=await payments.createOrder(input());payments.notify(notice(created.order_id));
 const broken=api.createCommerce({store,mailer:{async send(){throw Error('SMTP down');}},now:()=>1800000000000});await broken.drainMail();assert.equal(store.snapshot().orders[created.order_id].status,'paid');assert.equal(Object.values(store.snapshot().commerce.jobs)[0].status,'pending');advance(120000);await commerce.drainMail();assert.equal(sent.length,1);
 const next=await payments.createOrder(input(2));payments.notify(notice(next.order_id));payments.notify(notice(next.order_id,'CD'));await commerce.drainMail();assert.equal(sent.length,1);
});
test('password auth and roles isolate partner data; unknown referral and header-injection email cannot create gateway orders',async t=>{
 const{commerce,payments}=fixture(t);const{partner,admin}=agent(commerce);assert.throws(()=>commerce.login({code:'AGENT_A',password:'wrong'}));assert.throws(()=>commerce.createAgent(partner.token,{code:'OTHER',name:'其他',password:'AnotherPassword-123'}));assert.throws(()=>commerce.dashboard('badtoken'));assert.throws(()=>commerce.settings(partner.token,{public_enabled:false}));commerce.settings(admin.token,{public_enabled:false});await assert.rejects(payments.createOrder(input()));commerce.settings(admin.token,{public_enabled:true});assert.equal(payments.availability().enabled,true);
 await assert.rejects(payments.createOrder({...input(),referrer_code:'NONEXISTENT'}));await assert.rejects(payments.createOrder({...input(),buyer_email:'a@example.com\r\nBcc:bad@example.com'}));
});
