# Isolated E4N API smoke environment

From `server/`, run `npm ci` and `npm run test:isolated`. Docker must be running and the official `postgres:17` image must be available (`docker pull postgres:17` once). The script creates a uniquely named, temporary PostgreSQL 17 container bound to a random **127.0.0.1** port. It loads the schema portion of `init.sql` without its demo seed section, runs the repository's runtime schema setup, inserts only synthetic `example.invalid` fixtures, then probes the local API. The container is stopped and removed in a `finally` block.

The script clears production database URL variables and prevents `.env` loading before it imports application code. It never copies live Supabase rows, invokes payment, sends email, or changes the existing Docker Compose database. The report shows the local source-schema baseline, including known broken behavior; an HTTP 500 is recorded rather than treated as a successful feature test.

`init.sql` currently creates `groups` without `meeting_day`, but `runMigrations()` tries to alter that column and silently stops on SQLSTATE `42703`. The harness first records that failure, then adds **only in its disposable container** the missing column and retries so later probes can run. This shim is test setup, not a production migration or a fix to the repository schema. P09 must resolve the real bootstrap sequence.

This is a repeatable **source-schema** test environment, not a clone of the live Supabase schema. The live `notifications` columns, other schema drift, Supabase Auth/Storage and production scheduling still need separate isolated verification before related changes are considered complete.
