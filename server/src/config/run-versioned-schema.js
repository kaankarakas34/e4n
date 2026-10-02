import 'dotenv/config';
import pool from './db.js';

try {
  const { applyVersionedSchema } = await import('./versioned-schema.js');
  const result = await applyVersionedSchema();
  console.log(`Versioned schema applied=${result.applied.length} total=${result.totalVersions}`);
} catch (error) {
  console.error(`Versioned schema failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
