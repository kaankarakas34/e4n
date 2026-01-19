import 'dotenv/config';
import pkg from 'pg';

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

export default pool;
