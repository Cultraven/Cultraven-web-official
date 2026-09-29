const crypto = require('crypto');
const secret = 'cultraven-dev-secret-change-in-prod';
const payload = JSON.stringify({ userId: 'admin', email: 'jiteshbawaskar05@gmail.com', role: 'admin', iat: Date.now(), exp: Date.now() + 8 * 60 * 60 * 1000 });
const encoded = Buffer.from(payload).toString('base64url');
const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
const token = encoded + '.' + sig;

async function verifyToken(token) {
  const [encodedPayload, signature] = token.split('.');
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  let sigStr;
  try {
    const base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    // pad base64
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    sigStr = atob(base64 + pad);
  } catch(e) {
    console.log('atob error for sig:', e.message);
    return null;
  }

  const sigBuf = new Uint8Array(sigStr.length);
  for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);
  
  const isValid = await globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    sigBuf,
    encoder.encode(encodedPayload)
  );
  console.log('isValid:', isValid);
  
  let payloadStr;
  try {
     const base64p = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
     const pad = base64p.length % 4 === 0 ? '' : '='.repeat(4 - (base64p.length % 4));
     payloadStr = atob(base64p + pad);
  } catch(e) {
     console.log('atob error for payload:', e.message);
     return null;
  }
  console.log('payload:', payloadStr);
}

verifyToken(token);
