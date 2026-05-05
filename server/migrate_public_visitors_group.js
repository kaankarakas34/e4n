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
            console.log('Adding group_id to public_visitors...');
            await client.query(`
                ALTER TABLE public_visitors 
                ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id);
            `);
            console.log('Column added!');
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
