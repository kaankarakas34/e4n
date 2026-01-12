
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
            console.log('Creating table public_visitors...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS public_visitors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    company VARCHAR(255),
                    profession VARCHAR(255),
                    source VARCHAR(50) DEFAULT 'landing',
                    kvkk_accepted BOOLEAN DEFAULT FALSE,
                    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED')),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);
            console.log('Table created!');

            // Add index
            await client.query(`CREATE INDEX IF NOT EXISTS idx_public_visitors_email ON public_visitors(email)`);

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
