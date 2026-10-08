# Accepted connections and external referral recipient source

## Story

Chapter Management → Bağlantılarım and Referrals → EXTERNAL recipient selector use the same owner-scoped accepted relationship snapshot. A common group/lonca member is not automatically an accepted connection. Accepted relationships survive group departure.

## Contract

GET /api/user/connections is installed by connections.js. It uses the authenticated, currently existing database owner, a read-only REPEATABLE READ transaction, private/no-store and no query parameters. Bidirectional friend_requests ACCEPTED rows join existing counterpart users. Response {version:1,ownerId,connections:[{id,name,profession,company,city}]}; no phone/email/billing/password/score claims. Pending/rejected/self are excluded. More than one row for an owner/counterpart, unknown/null state or self-relation returns409; more than1000 rows returns503. No partial or deduplicated ambiguous success. Missing owner401, unauthenticated401, query override400, redacted readfailure500. Source data is unchanged; schema22 remains.

connectionsApi.list validates owner, UUIDs, states via minimal DTO, duplicate/self rows, length and field whitelist. Referral INTERNAL source remains explicit group/lonca; EXTERNAL maps this accepted list to id/name. Owner/role/token scope invalidates old responses. AcceptedConnectionsPanel handles actual empty/error/loading/retry, Turkish multi-field search and profile/message navigation; message uses recipient query parameter supported by MessagesPage. Receiver refresh clears an ineligible old selection.

## Acceptance

connections-contract + referral-contract --web-only + route-ownership-contract PASS; build/diff PASS. Fresh actual full browser61/0 includes previous55 cases and network/profile/message/source/error/refresh/replay/owner cases, final DB one EXTERNAL record. See E4N/09-Dogrulama/P39-Baglantilar-Yonlendirme-Kaynak-Veri-API-Web-2026-10-08.md for exact evidence. This is not a fresh whole34 API rerun or production release acceptance.

## Remaining boundaries

This is a source alignment, not a new membership/referral eligibility policy. Existing POST /referrals remains permissive about friend/group eligibility; no new INTERNAL common-group or EXTERNAL different-group requirement was selected. Existing keyed creation/receiver-only result and score rollback remain tested. Legacy /user/friends common-membership reader is preserved for compatibility and not used by these two web flows. No broad RLS claim, migration, production deployment, live Supabase write, real mail/payment or mobile/LMS work. P39/P37 stay In Progress for remaining routes/product-policy/release gates.
