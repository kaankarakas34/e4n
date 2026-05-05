import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const pool = new Pool(connectionString ? {
    connectionString,
    ssl: { rejectUnauthorized: false }
} : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function run() {
    try {
        console.log('Connecting to DB to fix meeting_day column type...');
        const client = await pool.connect();
        try {
            await client.query("ALTER TABLE groups ALTER COLUMN meeting_day TYPE VARCHAR(255) USING meeting_day::varchar");
            console.log('✅ Column meeting_day successfully converted to VARCHAR(255)!');
        } catch (e) {
            console.log('⚠️ Warning during alter: ', e.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

run();
