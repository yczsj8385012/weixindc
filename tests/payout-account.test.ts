import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatPayoutAccount} from '../src/payment/payout-account.ts';

test('withdrawal submission keeps payment method, recipient and account together',()=>{
 assert.equal(formatPayoutAccount({method:'wechat',name:'张三',qrImage:'data:image/png;base64,abc',wechatContact:'wxid_123'}),'微信收款码｜收款人：张三｜微信号（仅联系）：wxid_123');
 assert.equal(formatPayoutAccount({method:'alipay',name:'王五',account:'user@example.com'}),'支付宝｜收款人：王五｜收款账号：user@example.com');
 assert.equal(formatPayoutAccount({method:'bank',name:'李四',account:'6222000000000000',bank:'中国银行上海分行'}),'银行卡｜收款人：李四｜收款账号：6222000000000000｜开户行：中国银行上海分行');
});

test('bank withdrawal requires bank name and every method requires recipient details',()=>{
 assert.throws(()=>formatPayoutAccount({method:'bank',name:'李四',account:'6222000000000000'}),/开户行/);
 assert.throws(()=>formatPayoutAccount({method:'alipay',name:'',account:'user@example.com'}),/收款人/);
 assert.throws(()=>formatPayoutAccount({method:'wechat',name:'张三',wechatContact:'wxid_only'}),/收款码/);
});
