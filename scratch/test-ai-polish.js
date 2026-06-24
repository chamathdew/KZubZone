const crypto = require('crypto');
const fs = require('fs');

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = base64UrlEncode(JSON.stringify(header));
  const base64Payload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret)
    .update(base64Header + '.' + base64Payload)
    .digest();
  const base64Signature = base64UrlEncode(signature);
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

const secret = 'ksubzone_secret_key_2026';
const payload = {
  id: '4c01da04d4752d8ca352e7e0', // SuperAdmin ID
  role: 'admin',
  exp: Math.floor(Date.now() / 1000) + 3600
};
const token = signJwt(payload, secret);

const srtContent = `1
00:00:01,000 --> 00:00:04,000
I can't believe you actually did that.

2
00:00:05,000 --> 00:00:08,000
Where were you last night?

3
00:00:09,000 --> 00:00:12,000
I'm sorry, I didn't mean to hurt you.

4
00:00:13,000 --> 00:00:16,000
Let's go, we're already late.`;

console.log('Sending request to local PHP server...');
fetch('http://127.0.0.1:5000/api/admin/ai/polish', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ srtContent })
})
.then(async res => {
  console.log('Status Code:', res.status);
  const text = await res.text();
  console.log('Response Body:', text);
})
.catch(console.error);
