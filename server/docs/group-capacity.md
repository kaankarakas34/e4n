# Closed-group admission, transfer and capacity package

User decision, 5 October 2026: **35 members excluding the president**. `power_teams` remain outside this limit. No membership fee, overdue rights, shuffle cutoff, interview or service classification policy is introduced here.

## Application boundary

`group-capacity.js` starts READ COMMITTED transactions and acquires transaction advisory lock `(4020,35)` before the current mounted group writers. Lock timeout is 5 seconds, statement timeout 30 seconds. A post-write check runs before commit; capacity/role conflicts roll back every preceding membership and user-role change. Lock/statement/deadlock failures return a retryable 503 without exposing SQL.

Covered paths:

- Group acceptance/status and own join request: current database account/group role; a repeated join cannot demote an ACTIVE member. REQUESTED rows do not occupy active seats.
- Admin transfer: old memberships and new placement change atomically; a full destination preserves the source. Same-destination replay preserves joined_at. UPDATE precedes INSERT to avoid the legacy profession trigger rejecting its own member before ON CONFLICT.
- Group role assignment and admin user role edits: changing president exemption cannot create member #36. Role edits and admission share one transaction.
- Both mounted shuffle save paths: malformed/empty/duplicate-user payloads are rejected before writes; the final capacity check can roll back role reset, archive and inserts together. Existing membership pairs reactivate through upsert. This does **not** complete the shuffle product, cutoff eligibility, preview, placement history or notification workflow.

Legacy president interpretation is `group_members.role`, `users.role` or nullable `users.group_title` equal to PRESIDENT, counted once per member. Multiple president records produce an explicit conflict rather than exempting several seats. The group catalog/detail return the same interpretation, regular members, president count and remaining seats; the web preserves pending rows and displays a capacity failure instead of claiming acceptance.

## Schema 0015

CLI-generated `supabase/migrations/20261005141434_group_membership_state.sql` is registered in the existing checksummed version chain as `0015_group_membership_state`. It permits the INACTIVE state already used by transfer/shuffle and adds the nullable group_title field already referenced by role APIs. No rows, statuses or roles are backfilled. The old init/runtime migrations remain unchanged.

Existing unknown statuses fail validation and roll back the constraint/ledger change. Fresh install, repeated migration, existing-row upgrade, failed legacy status validation and recovery are exercised on disposable PostgreSQL 17. Reverting the old two-status constraint or dropping group_title requires checking existing INACTIVE/non-null data; blindly reversing would lose history. For deployment rollback, retain the compatible additive schema and roll back application code, or use the separately reviewed backup/cutover plan.

## Verification

- `node server/test/group-capacity-contract.mjs`: actual Express/JWT and PostgreSQL last-seat race (200/409), president exclusion, replay, transfer rollback, role demotion/admission rollback, both shuffle rollback/input guards, current-role revocation/foreign president denial, unrestricted 36-person power team, typed capacity reads, migration preservation and failure atomicity.
- Existing admin catalog/detail contracts: stable read snapshot, current role, malformed DTO and error recovery.
- Existing isolated smoke: 15 migrations/repeat 0, known init adoption, status transitions, capacity race and existing unresolved defects retained as explicit baselines. The event registration replay assertion was reconciled with its previously delivered versioned ACK rather than the obsolete message string.
- Actual browser components with isolated response fixtures: 35/35 plus one president, one rejected admission request, visible 409 and pending applicant retained, zero remaining seats, owner switch clears the catalog. Browser fixture routing is distinct from the actual HTTP/DB contract above.

## Remaining acceptance gates

This is application enforcement, **not a database trigger/constraint protecting arbitrary direct SQL or Supabase Data API writes**. P10 must resolve group-scoped leadership versus global user roles and multi-group membership; P16/D05 service conflicts and P18/D08 interview/final approval are separate unfinished rules. Existing oversized/ambiguous groups are surfaced, not silently repaired. Broad RLS/security remains Sprint 6. Live schema adoption/backup is P09 and is not simulated by a fresh fixture.

No production Supabase writes, actual mail, payment or production deployment occurred.

Lock semantics reference: https://www.postgresql.org/docs/17/explicit-locking.html
