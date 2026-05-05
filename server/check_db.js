import 'dotenv/config';
import pool from './src/config/db.js';

async function checkSchema() {
    try {
        const { rows } = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'groups'
        `);
        console.log('Columns in groups table:', rows);
        
        const data = await pool.query('SELECT name, meeting_dates FROM groups LIMIT 1');
        console.log('Sample group data:', data.rows);
    } catch (e) {
        console.error('Error checking schema:', e);
    } finally {
        process.exit();
    }
}

checkSchema();
