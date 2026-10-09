// Explicit target; no .env discovery. SELECT-only snapshot. Never applies migrations.
import pg from 'pg';
import {companyRegistrationPreflight} from '../src/company-registration-preflight.js';
const url=process.env.E4N_PREFLIGHT_DATABASE_URL;
if(!url)throw Error('Set E4N_PREFLIGHT_DATABASE_URL explicitly for the reviewed database.');
const pool=new pg.Pool({connectionString:url,max:1});const client=await pool.connect();
try{await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL statement_timeout='15s'");console.log(JSON.stringify(await companyRegistrationPreflight(client),null,2));await client.query('ROLLBACK');}
finally{client.release();await pool.end();}
