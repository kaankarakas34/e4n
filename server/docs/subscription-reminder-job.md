# Membership reminder delivery job (P34)

The server schedules the existing membership reminder days at 09:00 every day.
This package keeps the existing `3, 1, -1, -3, -5` day triggers and the existing
`ACTIVE` account filter. It does not define a new grace period, restriction,
shuffle cutoff, payment period or account reopening rule.

## Transaction and delivery contract

- A PostgreSQL advisory transaction lock allows one reminder scan at a time.
- The delivery claim, in-app notification and `last_reminder_trigger` update
  commit in one transaction. A failure rolls all three back.
- `(user_id, subscription_end_date, trigger_days)` is unique, so scheduler
  replay and concurrent invocations cannot create another notification or mail
  attempt for the same reminder.
- Mail runs only after the database transaction commits. Its result is stored as
  `SENT`, `UNKNOWN` or `NO_EMAIL`. An uncertain mail result is not retried because
  doing so could send the same reminder twice.
- The delivery ledger is private: RLS is enabled and PUBLIC, `anon` and
  `authenticated` table privileges are revoked. Users see the normal in-app
  notification through the existing authenticated API.
- Structured job results contain a run ID, outcome, counts and elapsed time;
  error details and addresses are not logged.

## Isolated verification

`npm --prefix server run test:subscription-reminder` owns a disposable
PostgreSQL 17 database. It verifies fresh migration 0017 and repeat zero, all
five trigger days, ACTIVE filtering, transaction rollback/retry, replay,
ten concurrent invocations, held-lock skip, SMTP uncertainty, missing email,
private ledger privileges, schedule callback and an actual JWT/Express web
notification read. Mail is a fake adapter.

The full web gate runs the same contract as one of its 29 suites. Production
build, isolated smoke and synthetic backup/restore are separate required checks.

## Remaining product and production gates

The requested five daily late-payment emails, fifth-day restriction, exact
restriction rights, shuffle cutoff, late payment admission and automatic account
reopening still require the remaining D07/D10 decisions. This job must not be
treated as implementing those rules. A production scheduler/external invocation,
live Supabase migration rehearsal and real provider monitoring also remain open.

No live Supabase write, real mail, payment or deployment is performed by these
tests.
