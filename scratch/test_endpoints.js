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
  const endpoints = [
    'https://api.ksubzone.com/api/media/home?nocache=1',
    'https://api.ksubzone.com/api/subtitles/recent?limit=4&nocache=1',
    'https://api.ksubzone.com/api/media/movies?sort=popular&country=&limit=12&nocache=1',
    'https://api.ksubzone.com/api/media/dramas?sort=popular&country=&limit=12&nocache=1'
  ];

  for (const ep of endpoints) {
    console.log(`\nFetching ${ep}...`);
    try {
      const res = await request(ep);
      console.log('Status:', res.status);
      console.log('Content-Type:', res.headers['content-type']);
      if (res.status === 200) {
        if (Array.isArray(res.data)) {
          console.log(`Success: Array of length ${res.data.length}`);
          if (res.data.length > 0) console.log('Sample:', JSON.stringify(res.data[0]).substring(0, 150));
        } else if (typeof res.data === 'object' && res.data !== null) {
          console.log('Success: Object keys:', Object.keys(res.data));
          if (res.data.movies) console.log('Movies length:', res.data.movies.length);
          if (res.data.dramas) console.log('Dramas length:', res.data.dramas.length);
        } else {
          console.log('Success: String snippet:', String(res.data).substring(0, 200));
        }
      } else {
        console.log('Error Data:', String(res.data).substring(0, 500));
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

run();
