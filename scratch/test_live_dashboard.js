const https = require('https');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('Logging in to live server...');
    const loginData = JSON.stringify({
      email: 'chamathd2002@gmail.com',
      password: '#Burnitdown2002#'
    });

    const loginRes = await request({
      hostname: 'www.ksubzone.com',
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);

    console.log('Login status:', loginRes.statusCode);
    const body = JSON.parse(loginRes.data);
    const token = body.token;
    console.log('Token received:', token ? 'YES' : 'NO');

    if (!token) {
      console.error('No token in response:', body);
      return;
    }

    console.log('Fetching dashboard stats...');
    const statsRes = await request({
      hostname: 'www.ksubzone.com',
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Stats status:', statsRes.statusCode);
    console.log('Response body:', statsRes.data);

  } catch (err) {
    console.error(err);
  }
}

run();
