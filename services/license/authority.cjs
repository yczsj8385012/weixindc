const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {pipeline}=require('node:stream/promises');
function atomic(file,value){const tmp=file+'.tmp';const fd=fs.openSync(tmp,'w',0o600);try{fs.writeFileSync(fd,value);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,file);}
function createAuthority({dir,uploadToken=''}){
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const keyFile=path.join(dir,'signing-private.pem');
 if(!fs.existsSync(keyFile)){
  if(fs.existsSync(path.join(dir,'state.json')))throw Error('Signing key missing: recovery required');
  const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'});
  fs.writeFileSync(keyFile,key,{flag:'wx',mode:0o600});
 }
 const privateKey=crypto.createPrivateKey(fs.readFileSync(keyFile));
 const publicKey=crypto.createPublicKey(privateKey).export({type:'spki',format:'pem'}).toString();
 const stateFile=path.join(dir,'state.json');
 const state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{version:1,cards:{
  'TEST-DEV-8888-AAAA-1111':{plan:'annual',max_devices:5,bound_machines:[],expire_time:Date.now()+365*86400000},
  'TEST-BIND-9999-BBBB-2222':{plan:'quarterly',max_devices:1,bound_machines:['fixed_machine_alpha_888'],expire_time:Date.now()+90*86400000},
  'TEST-EXPIRED-0000-CCCC':{plan:'quarterly',max_devices:1,bound_machines:[],expire_time:Date.now()-86400000}
 }};
 const persist=()=>atomic(stateFile,JSON.stringify(state));persist();
 const downloadDir=path.join(dir,'downloads');fs.mkdirSync(downloadDir,{recursive:true,mode:0o700});
 const zipName='ThinkAI_Wechat_Assistant_Win_x64_Green.zip';
 const send=(res,status,data)=>{res.writeHead(status,{'content-type':typeof data==='string'?'text/plain; charset=utf-8':'application/json; charset=utf-8','cache-control':'no-store'});res.end(typeof data==='string'?data:JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname.startsWith('/api/payment/'))return send(res,503,{code:503,message:'在线收款尚未开放，请联系管理员获取测试授权；不会收取费用。'});
   if(req.method==='GET'&&url.pathname==='/api/license/health')return send(res,200,{status:'ok',service:'thinkai-persistent-authority',version:2});
   if(req.method==='GET'&&url.pathname==='/api/license/public-key')return send(res,200,publicKey);
   if(req.method==='PUT'&&url.pathname==='/api/license/release-upload'){
    const supplied=req.headers.authorization||'';const expected='Bearer '+uploadToken;
    if(!uploadToken||supplied.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return send(res,404,{code:404});
    let size=0;req.on('data',b=>{size+=b.length;if(size>230000000)req.destroy();});
    const tmp=path.join(downloadDir,zipName+'.upload');
    await pipeline(req,fs.createWriteStream(tmp,{mode:0o600}));
    if(size<10000000)throw Error('Invalid release size');
    const hash=crypto.createHash('sha256');for await(const b of fs.createReadStream(tmp))hash.update(b);
    fs.renameSync(tmp,path.join(downloadDir,zipName));return send(res,200,{bytes:size,sha256:hash.digest('hex')});
   }
   if((req.method==='HEAD'||req.method==='GET')&&url.pathname==='/downloads/'+zipName){
    const file=path.join(downloadDir,zipName);if(!fs.existsSync(file))return send(res,404,'Release not yet available');
    res.writeHead(200,{'content-type':'application/zip','content-length':fs.statSync(file).size,'content-disposition':`attachment; filename="${zipName}"`,'cache-control':'public, max-age=300','x-content-type-options':'nosniff'});
    if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);
   }
   if(!['/api/license/verify','/api/license/renew'].includes(url.pathname)||req.method!=='POST')return send(res,404,{code:404,message:'Not found'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return send(res,413,{code:413});}
   let body;try{body=JSON.parse(raw);}catch{return send(res,400,{code:4001,message:'请求格式不正确'});}
   const {card_key,machine_id,nonce,timestamp}=body;
   if(typeof card_key!=='string'||!/^[-A-Za-z0-9]{8,100}$/.test(card_key)||typeof machine_id!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(machine_id)||typeof nonce!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(nonce)||!Number.isSafeInteger(timestamp)||Math.abs(Date.now()-timestamp)>300000)return send(res,400,{code:4001,message:'请求参数或电脑时间不正确'});
   const key=card_key.toUpperCase();const card=Object.hasOwn(state.cards,key)?state.cards[key]:null;
   if(!card)return send(res,403,{code:4004,message:'卡密不存在或已注销'});
   if(card.expire_time<=Date.now())return send(res,403,{code:4002,message:'卡密已到期，请续费'});
   if(!card.bound_machines.includes(machine_id)){
    if(url.pathname.endsWith('/renew'))return send(res,403,{code:4003,message:'该电脑尚未绑定，请先激活'});
    if(card.bound_machines.length>=card.max_devices)return send(res,403,{code:4003,message:'该卡密已达最大绑定设备上限'});
    card.bound_machines.push(machine_id);persist();
   }
   const data={card_key,expire_time:card.expire_time,machine_id,max_devices:card.max_devices,nonce,plan:card.plan,status:'active',timestamp};
   if(url.pathname.endsWith('/renew'))data.renewed_at=Date.now();
   const canonical=Object.keys(data).sort().map(k=>`${k}=${data[k]}`).join('&');
   return send(res,200,{code:0,message:'success',data,signature:crypto.sign('RSA-SHA256',Buffer.from(canonical),privateKey).toString('base64'),offline_grace_seconds:259200});
  }catch{if(!res.headersSent)send(res,500,{code:500,message:'服务暂不可用'});else res.destroy();}
 });
 server.requestTimeout=120000;server.headersTimeout=15000;
 return {server,publicKey};
}
exports.createAuthority=createAuthority;
if(require.main===module){
 const app=createAuthority({dir:process.env.THINKAI_AUTH_DIR||'/var/lib/thinkai-authority',uploadToken:process.env.RELEASE_UPLOAD_TOKEN||''});
 app.server.listen(Number(process.env.PORT||8788),'127.0.0.1',()=>console.log('ThinkAI durable authority listening'));
}
