import pool from '../server/src/config/db.js';
const res = await pool.query('SELECT * FROM groups');
console.log(JSON.stringify(res.rows, null, 2));
process.exit(0);
