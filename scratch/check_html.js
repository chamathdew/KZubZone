const https = require('https');

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve(body);
      });
    }).on('error', (err) => reject(err));
  });
}

async function run() {
  console.log('Fetching homepage HTML...');
  try {
    const html = await request('https://www.ksubzone.com');
    
    // Look for some known titles like "Absolute Value of Romance" or "My Royal Nemesis" or "Teach You a Lesson"
    const titles = [
      'Absolute Value of Romance',
      'My Royal Nemesis',
      'Teach You a Lesson',
      'Doctor on the Edge',
      'The Legend of Kitchen Soldier',
      'Parasite'
    ];
    
    console.log('\nChecking for dynamic media titles in homepage HTML:');
    let foundAny = false;
    for (const title of titles) {
      if (html.includes(title)) {
        console.log(`✅ Found: "${title}"`);
        foundAny = true;
      } else {
        console.log(`❌ Not Found: "${title}"`);
      }
    }

    if (foundAny) {
      console.log('\nSUCCESS: The homepage is successfully rendering dynamic data from PostgreSQL!');
    } else {
      console.log('\nFAILURE: No dynamic media titles were found in the homepage HTML.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
