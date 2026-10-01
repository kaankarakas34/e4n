# Isolated E4N API smoke environment

From `server/`, run `npm ci` and `npm run test:isolated`. Docker must be running and the official `postgres:17` image must be available (`docker pull postgres:17` once). The script creates a uniquely named, temporary PostgreSQL 17 container bound to a random **127.0.0.1** port. It loads the schema portion of `init.sql` without its demo seed section, runs the repository's runtime schema setup, inserts only synthetic `example.invalid` fixtures, then probes the local API. The container is stopped and removed in a `finally` block.

The script clears production database URL variables and prevents `.env` loading before it imports application code. It never copies live Supabase rows, invokes payment, sends email, or changes the existing Docker Compose database. The report verifies public and admin event listings against future, past and draft fixtures. It also checks that reading the list leaves stored event statuses intact and records constraint failures for `group_members`, `power_team_members`, and `visitors` using rolled-back transactions.

`init.sql` creates `groups` without `meeting_day`; `runMigrations()` now adds it before altering its type. The harness checks clean setup, safe reapplication, and that an induced missing-table error reaches the caller. It no longer uses a local schema shim. A full ordered migration chain and the three additional live tables remain P09 work.

This is a repeatable **source-schema** test environment, not a clone of the live Supabase schema. The live `notifications` columns, other schema drift, Supabase Auth/Storage and production scheduling still need separate isolated verification before related changes are considered complete.
