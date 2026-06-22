const https = require('https');

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed = body;
        if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
          try {
            parsed = JSON.parse(body);
          } catch (e) {}
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    }).on('error', (err) => reject(err));
  });
}

async function run() {
  const url = 'https://www.ksubzone.com/api/media/home?nocache=1';
  console.log(`Fetching from frontend domain: ${url}...`);
  try {
    const res = await request(url);
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers['content-type']);
    if (res.status === 200) {
      if (typeof res.data === 'object' && res.data !== null) {
        console.log('Success! Keys:', Object.keys(res.data));
      } else {
        console.log('Body snippet:', String(res.data).substring(0, 500));
      }
    } else {
      console.log('Error Body:', String(res.data).substring(0, 500));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
