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
  const path = '/';
  const revalUrl = `https://www.ksubzone.com/api/revalidate?secret=${secret}&path=${encodeURIComponent(path)}`;

  console.log(`Sending GET request to revalidate: ${revalUrl}...`);
  try {
    const res = await request(revalUrl);
    console.log('Revalidation Status:', res.status);
    console.log('Revalidation Response:', res.data);

    if (res.status === 200) {
      console.log('\nFetching homepage HTML to verify if dynamic data is now loaded...');
      const homeRes = await request('https://www.ksubzone.com?nocache=' + Date.now());
      const bodyStr = String(homeRes.data);
      if (bodyStr.includes('initialLibraryMovies')) {
        const match = bodyStr.match(/initialLibraryMovies":\s*({[^}]+})/);
        if (match) {
          console.log('Found initialLibraryMovies in HTML:', match[1]);
        } else {
          // Print where initialLibraryMovies is
          const idx = bodyStr.indexOf('initialLibraryMovies');
          console.log('Found initialLibraryMovies at index', idx);
          console.log('Context:', bodyStr.substring(idx - 100, idx + 300));
        }
      } else {
        console.log('Could not find initialLibraryMovies in HTML!');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
