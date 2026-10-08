# Administrator guild creation and settings — P39/P31

The existing non-education guild settings flow now has one active provider in `src/power-team-settings.js`. No admission, presidency, service classification, membership entitlement or score rule is introduced.

## API and data

- Existing POST `/api/power-teams` and PUT `/api/power-teams/:id` require a signed-in existing database ADMIN. A shared actor row lock prevents a concurrent role change from passing a write with stale JWT permissions.
- UUID creation IDs are supported. The web retains one ID and normalized name through an uncertain response. Concurrent retries serialize with a transaction advisory lock; the same ID/content returns the existing row, different content returns 409. Calls without a supplied ID retain compatibility but do not gain retry deduplication. After a successful later edit, an old create payload can return 409 rather than replay a previous receipt; this is row-based deduplication, not an immutable operation ledger.
- Partial updates lock the row and preserve omitted description, status and email template values. Editing a DRAFT no longer silently activates it. Existing ACTIVE creation behavior is retained. No membership rows are changed, and no email is sent by settings writes.
- Unknown fields, malformed UUIDs, blank/overlong names, invalid status and overlong text return 400; missing update target returns 404; unique-name collision returns 409. Unexpected failures return redacted 500 after rollback. The write permits existing legacy null status to remain null; it does not reinterpret historical state.
- New GET `/api/admin/power-team-settings` is an owner-bound private/no-store, read-only repeatable snapshot. It selects settings fields only, has deterministic name/UUID order, rejects query overrides and returns 503 above 1,000 rows. Existing general `/power-teams` catalogue and membership/deletion routes are retained; they are outside this authorization acceptance.
- Saved writes include `settingsVersion=1`, `ownerId` and the canonical stored row. The typed web transport verifies owner, ID, fields, dates and requested values before showing success.
- No schema migration or API-time DDL was added: the existing 22 migrations provide the required columns.

## Web

AdminGroups uses the private settings catalogue, real status labels and Turkish name/description search. Loading, true empty, search empty, read error and retry are separate. Latest-read sequencing prevents older catalogue responses from replacing a refreshed list.

Creation has a synchronous write lock, fixed payload during uncertain outcome, same-ID retry and an acknowledgement separate from the subsequent catalogue refresh. Closing/reopening the pending modal or switching tabs retains the pending intent. Old account/role/token completions are discarded. A successful write followed by a failed catalogue read displays the saved acknowledgement and retries the read only.

AdminGroupDetail sends only actual guild settings fields and renders the canonical saved response, including trimmed/cleared text. The compatible GroupDetail settings caller also uses the saved row, guards account/token changes and locks saves. Neither screen claims that membership acceptance or other legacy operations are complete.

Pending creation IDs live in memory. Reloading the page loses them; inspect the current catalogue before starting another operation. Ordinary settings PUT retries set the same requested values but have no optimistic version check: concurrent conflicting edits still use the last committed values. Template bytes are stored, not previewed or sent here; existing template sending and broader security remain separate acceptance gates.

## Verification

`node server/test/power-team-settings-contract.mjs` uses disposable loopback PostgreSQL 17 and the actual Express app and transpiled TS transport: current role/demotion/deleted actor, eight concurrent same-ID creates with one row, replay/conflict/name collision, DRAFT and template preservation, malformed payload, missing target, injected write rollback/redaction, owner-bound catalogue and bound, and false owner/ID/name/type acknowledgements.

`node server/test/route-ownership-contract.mjs` verifies 178 exact static/runtime routes, 25 active providers and 17 retained unmounted modules. The contract is included in the common API acceptance runner; inclusion alone is not evidence of a new whole-run pass.

The actual application browser suite includes guild error/retry, lost POST acknowledgement with same ID after closing/reopening and changing tabs, Turkish search, acknowledged-save/read failure with no second POST, canonical detail edit/reload, owner switch and final database reconciliation. See the dated Obsidian receipt for executed report paths and outcomes. No production database, deployment, real payment or real email is used.

Transaction lock behavior follows the [PostgreSQL explicit locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html).
