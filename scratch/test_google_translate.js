import fetch from 'node-fetch';

const text = "Hello, how are you?";
const sl = 'en';
const tl = 'si';
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

console.log(`Requesting: ${url}`);

try {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log('Response data:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Error:', err);
}
