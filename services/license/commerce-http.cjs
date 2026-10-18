const net=require('node:net');const{PaymentError}=require('./payment-service.cjs');const{readBody}=require('./payment-http.cjs');
function createCommerceHandler(commerce){const buckets=new Map();return async(req,res,url)=>{
 if(!url.pathname.startsWith('/api/payment/commerce/'))return false;
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try{
  let ip=req.socket.remoteAddress||'unknown';if(['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)&&typeof req.headers['x-forwarded-for']==='string'){const last=req.headers['x-forwarded-for'].split(',').at(-1).trim();if(net.isIP(last))ip=last;}
  const path=url.pathname.slice('/api/payment/commerce/'.length);const strict=path==='login'||path.startsWith('recover/');const now=Date.now(),key=(strict?'strict:':'normal:')+ip;
  for(const[k,v]of buckets)if(v.until<=now)buckets.delete(k);if(!buckets.has(key)){if(buckets.size>=5000)throw new PaymentError('请求繁忙',429);buckets.set(key,{count:0,until:now+60000});}if(++buckets.get(key).count>(strict?10:120))throw new PaymentError('请求过于频繁，请稍后再试',429);
  const token=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'')?.[1];
  if(req.method==='GET'&&path==='meta'){send(200,{code:0,data:{mail_ready:commerce.mailReady()}});return true;}
  if(req.method==='GET'&&path==='dashboard'){send(200,{code:0,data:commerce.dashboard(token)});return true;}
  if(req.method!=='POST')throw new PaymentError('接口不存在',404);
  if(!['https://thinkai.vip','https://www.thinkai.vip'].includes(req.headers.origin))throw new PaymentError('请求来源不允许',403);
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw new PaymentError('请求格式不支持',415);
  let body;try{body=JSON.parse(await readBody(req,path==='withdraw'?81920:8192));}catch(e){if(e instanceof PaymentError)throw e;throw new PaymentError('JSON格式不正确');}
  if(!body||typeof body!=='object'||Array.isArray(body))throw new PaymentError('请求格式不正确');let data;
  switch(path){case'login':data=commerce.login(body);break;case'agents':data=commerce.createAgent(token,body);break;case'withdraw':data=commerce.withdraw(token,body);break;case'withdraw/settle':data=commerce.settle(token,body);break;case'recover/request':data=commerce.requestRecovery(body.email);break;case'recover/verify':data=commerce.verifyRecovery(body);break;case'delivery':data=commerce.adminDelivery(token,body);break;case'settings':data=commerce.settings(token,body);break;default:throw new PaymentError('接口不存在',404);}
  send(200,{code:0,data});return true;
 }catch(e){const status=e instanceof PaymentError?e.status:500;send(status,{code:status,message:e instanceof PaymentError?e.message:'服务暂不可用'});return true;}
};}
module.exports={createCommerceHandler};
