const https = require('https');

const text = "1\n00:00:10,650 --> 00:00:15,650\nHello.\n\n2\n00:00:16,000 --> 00:00:20,000\nHow are you?";
const sl = 'en';
const tl = 'si';
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

console.log(`Requesting: ${url}`);

const req = https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
}, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response json[0]:', JSON.stringify(parsed[0], null, 2));
      
      let translatedText = '';
      for (const sentences of parsed[0]) {
        translatedText += sentences[0] || '';
      }
      console.log('--- RECONSTRUCTED TRANSLATED TEXT ---');
      console.log(translatedText);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (err) => {
  console.error('Error:', err);
});
