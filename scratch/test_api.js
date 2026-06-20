const https = require('https');

function request(url, method, headers, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
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
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('Fetching "my-royal-nemesis" WITHOUT token...');
    const resNoToken = await request('https://www.ksubzone.com/api/media/dramas/my-royal-nemesis', 'GET', {});
    console.log('Without Token: Status =', resNoToken.status);
    if (resNoToken.status === 200) {
      console.log('Seasons count:', resNoToken.data.seasons?.length);
      console.log('Episodes count:', resNoToken.data.episodes?.length);
    } else {
      console.log('Response:', resNoToken.data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
