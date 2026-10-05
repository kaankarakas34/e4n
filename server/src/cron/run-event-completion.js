import 'dotenv/config';
import {runEventCompletion} from './event-completion.js';

// Rehearsal command only. External/production writes are deliberately not a CLI option.
const args=process.argv.slice(2);
if(args.some(a=>a!=='--apply-isolated'))throw new Error('Use no arguments for dry-run, or --apply-isolated for a local fixture.');
const apply=args.includes('--apply-isolated');
if(apply && (process.env.NODE_ENV!=='test' || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || !['127.0.0.1','localhost','::1'].includes(process.env.DB_HOST))) {
 throw new Error('Applying this command requires a test environment and explicit loopback DB_HOST without connection URLs.');
}
const {default:pool}=await import('../config/db.js');
try{await runEventCompletion(pool,{dryRun:!apply});}catch{process.exitCode=1;}finally{await pool.end();}
