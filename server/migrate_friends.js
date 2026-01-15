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
        console.log("Checking tables...");
        // Friend Requests Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS friend_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
                receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(sender_id, receiver_id)
            );
        `);
        console.log("✅ friend_requests table checked/created.");
    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        pool.end();
    }
}

run();
