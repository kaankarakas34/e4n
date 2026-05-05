const { Pool } = require('pg');

async function queryAdmins() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'e4n2',
    password: 'e4n2pass',
    database: 'e4n2db',
  });
  
  try {
    const res = await pool.query("SELECT name, email, role FROM users WHERE role = 'ADMIN'");
    console.log('Admin Hesapları:');
    res.rows.forEach(row => {
      console.log(`İsim: ${row.name}, Email: ${row.email}`);
    });
  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await pool.end();
  }
}

queryAdmins();
