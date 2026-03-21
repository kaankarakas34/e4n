import pool from './src/config/db.js';

async function test() {
  try {
    const res = await pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['groups']);
    console.log(res.rows);
  } catch(e) { console.error(e); }
  process.exit(0);
}
test();
