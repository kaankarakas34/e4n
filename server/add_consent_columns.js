
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://e4n2:e4n2pass@localhost:5433/e4n2db';

const pool = new Pool({
    connectionString,
    // ssl: { rejectUnauthorized: false } // Disable for local
});

async function run() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
        try {
            console.log('Adding missing columns to users table...');

            await client.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS kvkk_consent BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS explicit_consent BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE';
            `);

            console.log('Columns added successfully!');
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
