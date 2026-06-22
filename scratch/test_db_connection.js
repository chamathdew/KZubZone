const { Client } = require('pg');

const hosts = [
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-1-ap-south-1.pooler.supabase.com'
];

const ports = [5432, 6543];

async function test(host, port) {
  console.log(`Connecting to ${host} on port ${port}...`);
  const client = new Client({
    host: host,
    port: port,
    database: 'postgres',
    user: 'postgres.ejvczjiueysbiewzsuin',
    password: '#Chamathd2002#',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    const t1 = Date.now();
    await client.connect();
    const t2 = Date.now();
    console.log(`✅ SUCCESS: Connected to ${host}:${port} in ${t2 - t1}ms`);
    
    // Run simple query
    const res = await client.query('SELECT COUNT(*) FROM movies');
    console.log(`   Query result: ${res.rows[0].count} movies`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ FAILED: ${host}:${port} -> ${err.message}`);
    try {
      await client.end();
    } catch (e) {}
    return false;
  }
}

async function runAll() {
  for (const host of hosts) {
    for (const port of ports) {
      await test(host, port);
      console.log('----------------------------------------');
    }
  }
}

runAll();
