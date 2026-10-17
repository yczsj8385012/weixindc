import crypto from 'node:crypto';

// 动态密钥对支持：优先读取环境变量，否则在服务端启动时安全生成全新 2048 位 RSA 密钥对
// 彻底解决源码 ZIP 导出时硬编码私钥的安全泄露隐患
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
      console.warn('[LicenseService] 环境变量 RSA_PRIVATE_KEY 解析失败，将使用动态生成的随机密钥对:', e);
    }
  }

  // 内存中动态生成全新的 2048 位 RSA 密钥对（不落盘、不写入源码）
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  return { privateKey, publicKey };
}

const KEYS = initKeys();

export const RSA_PUBLIC_KEY = KEYS.publicKey;
export const RSA_PRIVATE_KEY = KEYS.privateKey;

export function canonicalString(data: Record<string, any>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('&');
}

export function signData(data: Record<string, any>): string {
  const canonical = canonicalString(data);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical, 'utf8');
  return signer.sign(RSA_PRIVATE_KEY, 'base64');
}

export function verifyData(data: Record<string, any>, signature: string): boolean {
  const canonical = canonicalString(data);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(canonical, 'utf8');
  return verifier.verify(RSA_PUBLIC_KEY, signature, 'base64');
}

