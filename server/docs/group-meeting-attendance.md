# Group meeting observation: API, data and web

This is the decision-independent bulk writer part of P26/P31/P39. Membership prices, rights, scoring/removal rules, final admission and the final group-scoped leadership model remain open. No mobile/LMS work, live database change, real payment or mail is included.

## Existing workflow and boundary

The mounted POST `/api/events/attendance` previously accepted any authenticated actor and arbitrary attendee identities, created a fresh meeting on each retry, and launched legacy scoring after committing attendance. The member QuickActions form sent a different self-report payload to that same meeting-creation route. Its promise of a saved self-report was unsupported.

The current writer uses the existing `requireGroupManager` interpretation already used by group mutations: current DB ADMIN, or an ACTIVE membership with the interim PRESIDENT interpretation. It does not grant a new president correction privilege. Unrelated presidents and revoked/deleted accounts cannot write. The final P10 role model remains separate.

## One transaction and one intent

POST requires exactly requestId, group_id, meeting_date, topic, reason and items. Every current ACTIVE group member must have an explicit PRESENT/ABSENT/LATE/SUBSTITUTE selection. Duplicated identities, omitted/foreign/inactive members, invalid or future dates, unsupported fields/statuses and empty explanations fail before commit. The current roster is locked and checked in the same transaction, using the existing group mutation advisory lock, bounded statements and lock timeout.

The request UUID is the event UUID. The meeting, registration rows, observation changes and one immutable revision-1 history entry per attendee commit together. A failure in any history insert rolls back the meeting and every attendee. The existing append-only verification table is reused. No historical registrations are backfilled as observations. The original REGISTERED to observed-state transition occurs within the transaction.

Concurrent/repeated identical commands return one saved meeting. Different intent under the same UUID returns409. A deleted event with surviving initial history also permanently reserves the UUID; retry cannot resurrect it. Receipt reconstruction uses immutable initial history and the persisted event metadata; later attendance correction does not destroy the receipt. Editing/deleting event metadata can make reconciliation fail explicitly; this is not a general immutable meeting ledger. Removing an attendee later does not erase the initial creation receipt. The receipt describes initial creation, not current attendance.

GET `/api/events/attendance/submissions/:id` returns only the initiating current manager's minimal private/no-store receipt. It never accepts an owner override. Both POST and GET acknowledge owner, group, event/request ID, participant count and SHA256 of the normalized complete command. The typed web client verifies the hash before declaring success.

Observation no longer launches legacy score recalculation from this writer, consistent with the explicit admin observation path. Cached scores stay unchanged; target score/rights policy is not selected here. Other existing score writers/jobs remain outside this delivery.

## Web behavior

GroupManagerDashboard has no default PRESENT selections. Topic and explanation are controlled accessible inputs. A synchronous guard prevents double-click mutations. A pending command is frozen, stored per owner/group in tab session storage when available, restored on page reload, and reused in an explicit retry. If tab storage is unavailable, the mounted view retains the command; closing that tab loses it, so inspect saved meetings before starting a new observation.

A lost write reply triggers GET-only reconciliation. Unresolved outcomes retain the command; an explicit retry reuses the same UUID and complete payload. Only a definite400/409/422 plus owner receipt404 clears a rejected intent. Current owner/role/token/group context and unmount checks suppress stale acknowledgements. A confirmed save clears the pending command; a meeting-list refresh failure cannot repeat creation.

The unsupported member self-report form displays its availability limit and links to the real event registration page. It does not falsely claim success or call the bulk writer. Self-report/substitute product rules remain unfinished.

## Schema and release constraints

CLI-generated migration `20261008191226_group_meeting_attendance.sql`, registered as0024, expands the existing history after-status constraint to the LATE/SUBSTITUTE values already used by group meeting observations. Existing migrations/checksums, rows, append-only triggers, RLS and private grants are preserved. There are24 source versions and47 tables including the ledger; no new table is introduced.

API-time DDL is absent. Fresh/repeat and23→24 adoption are verified only on disposable PostgreSQL17. Reverting the constraint with LATE/SUBSTITUTE history would fail; do not delete history to force rollback. Deploy API and web together: obsolete bulk payloads are deliberately rejected. Earlier typed history readers may reject new after-status values, so rollback requires a compatible application patch or the separately reviewed backup/cutover plan. Production adoption and broad security remain separate gates.

Verification: `node server/test/group-meeting-attendance-contract.mjs`, existing event-attendance contract, migration/adoption/restore contracts, route ownership, build, and real web→Express/JWT→disposable PostgreSQL browser cases in the common rehearsal. Final evidence is recorded separately; prior failed/incomplete runs are retained.
