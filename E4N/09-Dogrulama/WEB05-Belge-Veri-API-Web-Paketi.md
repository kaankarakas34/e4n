# WEB-05 / E4N-138 — belge merkezi

5 Ekim 2026; Done; commit/push b56d119.

# Web document library (WEB-05 / E4N-138)

## Storage and release

Metadata lives in `document_library`; file bytes live in `document_files.content` (PostgreSQL bytea), joined by document UUID. Both commit in one transaction. This is persistent database storage compatible with the current Supabase PostgreSQL connection, not the ephemeral Vercel `/uploads` disk. Metadata reads never fetch file bytes. PDF/PNG/JPEG only, magic signature + filename extension, max 3 MiB per document. Browser uploads use multipart; authenticated downloads return attachment bytes, nosniff, private/no-store. No public URL, service key or anonymous table policy is introduced. Signature checking is not malware scanning.

This small-file implementation avoids an external Storage bucket configuration dependency and cross-service orphan cleanup. Large documents, Storage migration, total storage quota, malware scanning and physical retention/purge policy remain separate follow-up work. Archived files still consume database/backup space. Existing accounting invoice uploads remain a separate unresolved disk lifecycle; this delivery does not change them.

0012_document_library loads the CLI-created SQL file through the existing checksum ledger. Fresh install: 12 versions / 40 application tables. No runtime schema mutation was added. Live Supabase is untouched; P09 release still requires actual-schema migration rehearsal and trusted backend role verification. These tables have RLS enabled and PUBLIC/anon/authenticated grants revoked; backend-only connection must own the tables or have reviewed bypass rights. Do not grant permissive client policies.

## API

- GET /api/documents: ownerId, canUpload, visible metadata and per-row canArchive. Visibility uses current database role: ADMIN sees all, uploader sees own, empty roles means all signed-in users, otherwise selected roles only.
- POST /api/documents: file, title, description, category, allowed_roles JSON, requestKey UUID. Only current DB ADMIN/PRESIDENT can upload. User/role from JWT owner plus database, never client uploaded_by. Key scoped to uploader, serialized by advisory transaction lock; fingerprint includes normalized fields, filename, bytes digest and sorted roles. Same payload replays one row; conflict or archived key returns409. Metadata/file failure rolls back both.
- GET /api/documents/:id/download: fresh role/visibility check; archived or inaccessible document404; exact stored bytes with filename attachment.
- DELETE /api/documents/:id: ADMIN or uploader only. Locks row and records archived_at; repeated archive succeeds. Does not physically delete metadata/file/user history. A demoted uploader retains access to own records but loses ability to create new uploads.

Web standalone and LMS embedded use the same component/service. Scope includes session user/role/token, old data/form hidden on scope change; effects and mutation epoch guard stale callbacks. Synchronous operation lock prevents double submission. Uncertain upload keeps identical key/file/form for retry while mounted; definitive4xx reopens editing. ACK resets form before list refresh, so a read failure cannot resend an acknowledged upload. Pending upload file/key are memory-only: after navigation/reload verify list before uploading again; no cross-reload idempotency claim is made.

## Verification

`node server/test/documents-contract.mjs`: loopback disposable PostgreSQL17, no real env/production database. Fresh12/repeat0/11→12, multipart size/signature, role/demotion/visibility, exact download bytes, 8-way same-key race, replay/conflict, injected post-metadata file failure rollback/retry, archive repeat/retained history, FK, revoked default grants and RLS SELECT/INSERT denial after explicit grants. Actual transpiled TypeScript web service with bearer/multipart/Blob through Express and PG.

`node server/test/isolated-smoke.mjs`: pass against12/40, legacy adoption/versioned upgrade and existing regressions. `node server/test/messages-contract.mjs`: pass with12 versions. Existing schema assertions upgraded together.

`npm run check`, `npm run build`, `git diff --check`: pass; existing Vite bundle/browsers data warnings remain.

Playwright actual DocumentsPage/auth store/typed transport in local Vite harness using captured isolated API fixtures: read failure/retry, file selection, simulated post-commit response failure, identical-key retry/single visible row, owner change removes old document/upload control. Screenshot `output/playwright/documents-recovered.png` visually reviewed. Browser fixtures are simulated responses, not live production or full browser→database deployment acceptance.
