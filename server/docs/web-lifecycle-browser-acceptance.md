# P37 — meeting requests, referral business and support web acceptance

The existing full styled application fixture now follows three real UI → bearer API → PG17 → response flows. All endpoints and database rows are actual disposable application components; no feature API response is mocked. Mail remains a local fake transport. Existing API/data33-pass evidence from 2026-10-08T08-16-50-617Z is reused because application/API/schema code is unchanged by this acceptance package.

## Stories

- Member creates a support ticket through the form, reloads and reads its initial message. Administrator answers it, closes it and reloads it. Member returns and reads the answer with the reply form absent on a closed ticket.
- Member creates a referral to the connected president using INTERNAL in their actual common group. Existing shuffle place locks retain the two fixture members together and the test verifies that persisted membership. Sender cannot settle it. Receiver records successful business at120.50; reload preserves status and the settlement action disappears.
- Member creates a meeting request from the other person's public profile; reload preserves it. Sender cannot accept it. Receiver accepts and reloads; the calendar action appears. Accepted request is evidence of a request, not a completed meeting.
- An unrelated account logs in and cannot see the member's referral, meeting request or support ticket across their actual pages.

A fresh localStorage reset runs before React only when loading the login route. It supports returning to the same actor during lifecycle tests; normal application navigation/reload retains authentication.

## Final database reconciliation

One CLOSED support ticket belongs to the member, one SUCCESSFUL120.50 referral has exactly the intended giver and receiver, one ACCEPTED request has exactly the intended requester/partner. All prior group, shuffle, immutable history, invoice bytes, payment owner, registration statuses, document bytes and message ownership invariants remain in the same final-state acceptance gate.

The first expanded run 2026-10-08T08-39-50-328Z had44PASS4FAIL: the requested target was unavailable through the legacy friends source after shuffle, causing create/settle failures, a support test used the wrong reopen label, and reconciliation correctly failed for the missing referral. It is not acceptance; no production bug is claimed from these fixture/selector failures. Final fresh run is recorded in Obsidian.

P37 remains InProgress. This is acceptance for existing non-education web flows; D policy, explicit event check-in, live adoption/backup/provider, Sprint6 security and complete release gates remain open. No mobile/LMS, production database writes, deployment, real mail or payment.

## Open source mismatch

The EXTERNAL form says connections, but /api/user/friends currently returns common ACTIVE group/team members, not accepted friend_requests. An accepted cross-group connection can therefore be missing from that candidate list. Do not describe this as an enforced different-group policy. The second47PASS3FAIL run08-45-55 confirms that gap; it is not acceptance. This package validates the existing INTERNAL path with persisted group locks. Canonical external referral candidate eligibility remains an explicit P39/D-related follow-up; no policy/API access expansion was guessed.

## Final acceptance — 8 October 2026

Fresh run: **50 PASS / 0 FAIL**, exit0, `output/web-browser/2026-10-08T08-53-33-947Z/browser-report.json`. Administrator support screenshot inspected. Owned fixture and browser closed. The prior 33 API/data PASS report is reused on unchanged application/API/schema; no new build or API suite run is claimed.
