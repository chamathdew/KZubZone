const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server-php', 'ksubzone.sqlite');
console.log('Connecting to:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.all("SELECT * FROM settings", [], (err, rows) => {
    if (err) {
      console.error('Error querying settings:', err);
      db.close();
      return;
    }
    console.log('--- SETTINGS ROWS ---');
    rows.forEach((row) => {
      console.log(`ID: ${row._id}`);
      console.log(`Key: ${row.key}`);
      try {
        const parsedData = JSON.parse(row.data);
        console.log(`Data:`, JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log(`Data (raw):`, row.data);
      }
      console.log('--------------------');
    });
    db.close();
  });
});
