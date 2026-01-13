
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://e4n2:e4n2pass@localhost:5433/e4n2db';

const pool = new Pool({
    connectionString,
});

async function run() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        try {
            console.log('Adding company column to users table...');

            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS company VARCHAR(255);
            `);

            console.log('Company column added successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
