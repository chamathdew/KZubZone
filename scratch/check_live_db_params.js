const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.ejvczjiueysbiewzsuin',
  password: '#Burnitdown2002#',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to live PostgreSQL database!');
    
    const res = await client.query("SELECT * FROM settings WHERE key = 'siteContent'");
    if (res.rows.length === 0) {
      console.log('No siteContent setting found in settings table.');
    } else {
      const row = res.rows[0];
      console.log('siteContent Row Found!');
      console.log('ID:', row._id);
      
      const parsedData = JSON.parse(row.data);
      console.log('Current JSON Data:', JSON.stringify(parsedData, null, 2));
    }
  } catch (err) {
    console.error('Error connecting/querying:', err.message);
  } finally {
    await client.end();
  }
}

run();
