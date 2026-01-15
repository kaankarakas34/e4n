import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

// Explicit connection string that works
const connectionString = "postgres://postgres.kaoagsuxccwgrdydxros:vy%2F22xUZF3%2Fn8S8@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Checking users table for group_title column...");
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS group_title VARCHAR(100);
        `);
        console.log("✅ group_title column added to users table.");
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        pool.end();
    }
}

run();
