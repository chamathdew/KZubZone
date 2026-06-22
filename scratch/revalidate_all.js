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
  const secret = 'ksubzone_reval_secret_2026';
  const paths = [
    '/',
    '/drama/teach-you-a-lesson',
    '/drama/my-royal-nemesis',
    '/drama/absolute-value-of-romance',
    '/drama/the-legend-of-kitchen-soldier',
    '/drama/doctor-on-the-edge',
    '/drama/love-has-fireworks',
    '/drama/reborn-rookie',
    '/drama/fifties-professionals',
    '/movie/parasite',
    '/movie/exhuma',
    '/movie/holy-night-demon-hunters',
    '/movie/pretty-crazy',
    '/movie/the-roundup'
  ];

  console.log(`Revalidating ${paths.length} paths on the live frontend...`);
  
  for (const path of paths) {
    const revalUrl = `https://www.ksubzone.com/api/revalidate?secret=${secret}&path=${encodeURIComponent(path)}`;
    try {
      const res = await request(revalUrl);
      console.log(`Path: ${path} => Status: ${res.status}, Response:`, JSON.stringify(res.data));
    } catch (err) {
      console.error(`Failed to revalidate ${path}:`, err.message);
    }
  }
  
  console.log('\nAll revalidations finished!');
}

run();
