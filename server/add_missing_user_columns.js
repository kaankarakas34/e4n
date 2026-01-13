
import pkg from 'pg';
const { Pool } = pkg;
// Load env vars if needed, but for local dev we can hardcode or rely on defaults
// Just in case, let's use the standard connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding missing user columns...');
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50)");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100)");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address TEXT");
        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255)"); // Ensure it exists

        console.log('✅ Columns added successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
