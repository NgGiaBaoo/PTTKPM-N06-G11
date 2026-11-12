require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function seed() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'reset_and_create.sql'), 'utf8');
    await db.promise().query(sql);
    console.log('Database reset and sample data created successfully.');
    await db.promise().end();
  } catch (err) {
    console.error('Database reset failed:', err.message);
    process.exitCode = 1;
  }
}

seed();
