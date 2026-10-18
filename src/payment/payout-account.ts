export type PayoutMethod='wechat'|'alipay'|'bank';

export function formatPayoutAccount(details:{method:PayoutMethod;name:string;account?:string;bank?:string;qrImage?:string;wechatContact?:string}):string{
 const clean=(value:string|undefined)=>String(value||'').trim().replace(/\s+/g,' ');
 const name=clean(details.name),account=clean(details.account),bank=clean(details.bank),contact=clean(details.wechatContact);
 if(!name)throw Error('请填写收款人真实姓名');
 let result:string;
 if(details.method==='wechat'){
  if(!details.qrImage?.startsWith('data:image/'))throw Error('请上传微信收款码图片');
  result=`微信收款码｜收款人：${name}${contact?`｜微信号（仅联系）：${contact}`:''}`;
 }else if(details.method==='alipay'){
  if(!account)throw Error('请填写支付宝登录账号');
  result=`支付宝｜收款人：${name}｜收款账号：${account}`;
 }else if(details.method==='bank'){
  if(!/^\d{12,23}$/.test(account.replace(/\s/g,'')))throw Error('请填写有效的银行卡号');
  if(!bank)throw Error('请填写开户行（含省市支行）');
  result=`银行卡｜收款人：${name}｜收款账号：${account.replace(/\s/g,'')}｜开户行：${bank}`;
 }else throw Error('请选择收款方式');
 if(result.length>300)throw Error('收款资料过长，请缩短后重试');
 return result;
}
