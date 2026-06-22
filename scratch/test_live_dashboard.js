const { Client } = require('pg');
const crypto = require('crypto');

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = base64UrlEncode(JSON.stringify(header));
  const base64Payload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret)
    .update(base64Header + '.' + base64Payload)
    .digest();
  const base64Signature = base64UrlEncode(signature);
  return `${base64Header}.${base64Payload}.${base64Signature}`;
}

async function run() {
  console.log('Connecting to Supabase database...');
  const client = new Client({
    host: 'aws-1-ap-south-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.ejvczjiueysbiewzsuin',
    password: '#Chamathd2002#',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB successfully.');

    // Find admin ID
    console.log('Finding admin record...');
    const resAdmins = await client.query('SELECT * FROM "admins" LIMIT 1');
    if (resAdmins.rows.length === 0) {
      console.log('No admins found in database!');
      await client.end();
      return;
    }

    const admin = resAdmins.rows[0];
    const adminId = admin._id;
    console.log(`Found admin: ${adminId} (email: ${admin.email || admin.data?.email})`);

    // Generate JWT token
    const secret = 'ksubzone_super_secret_jwt_key_2024_change_in_production';
    const payload = {
      id: adminId,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const token = signJwt(payload, secret);
    console.log(`Generated Admin Token: Bearer ${token}`);

    // Call live dashboard endpoint
    console.log('Fetching live admin dashboard metrics...');
    const url = 'https://api.ksubzone.com/api/admin/dashboard?nocache=1';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    console.log('Status Code:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    await client.end();
  } catch (err) {
    console.error('Error during test:', err);
    try {
      await client.end();
    } catch (e) {}
  }
}

run();
