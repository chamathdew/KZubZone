const https = require('https');

const text = "Hello, how are you? Good morning.";
const sl = 'en';
const tl = 'si';

// Test with +
const urlPlus = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${text.replace(/ /g, '+')}`;
// Test with %20
const urlPercent = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

function makeRequest(url, label) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`--- ${label} ---`);
        console.log('Response:', data);
        resolve();
      });
    });
  });
}

async function run() {
  await makeRequest(urlPlus, 'Encoded with plus (+)');
  await makeRequest(urlPercent, 'Encoded with percent (%20)');
}

run();
