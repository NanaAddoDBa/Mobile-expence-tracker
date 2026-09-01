# QA And Release Checklist

Use this checklist against the exact release commit and a staging environment
that matches production topology. A local pass does not replace provider,
backup, TLS, or monitoring verification.

## Automated Gates

```powershell
npm.cmd install
npm.cmd --prefix server install
npm.cmd run db:format
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
npm.cmd run build:api
npm.cmd --prefix server run test -- --runInBand
npm.cmd --prefix server run test:e2e -- --runInBand
npm.cmd run lint
npm.cmd run lint:styles
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd audit
npm.cmd --prefix server audit
docker compose -f compose.local.yaml config
docker build -t expense-tracker-api:qa -f server/Dockerfile .
docker build -t expense-tracker-web:qa -f Dockerfile .
```

- Confirm all commands exit zero.
- Confirm the production API image applies pending migrations and starts.
- Confirm `/api/health/live` and `/api/health/ready` return `200` from the API
  image and readiness reports database `ok`.
- Confirm the web image serves the app, proxies `/api`, and returns the expected
  CSP and other security headers.
- Confirm production and full dependency audits report no unreviewed high or
  critical vulnerabilities.

## Authentication And Privacy

- Register a password account, receive verification mail, and verify it once.
- Confirm a reused, expired, or altered verification token fails.
- Log in and out; confirm logout invalidates the server session.
- Request password reset for existing and nonexistent addresses and confirm the
  public responses do not reveal account existence.
- Reset the password once; confirm token reuse and the old password fail.
- Change the password and verify other sessions are revoked as designed.
- Review active sessions, revoke one, and use logout-all.
- Sign in with Google on the exact staging origin and verify a stable account is
  reused on subsequent sign-ins.
- Confirm an existing password account is not silently linked by Google email.
- Export account data and inspect that expected user data is present while
  password/token/secret values are absent.
- Delete a test account with `DELETE`, confirm provider revocation, confirm the
  session no longer works, and verify primary rows are gone.

## User Isolation

Use two independent users for every user-owned resource:

- User B cannot read, update, or delete User A's income, expense, budget, goal,
  profile, session, or connected account by ID.
- User B cannot trigger import/reconnect/removal for User A's bank connection.
- List, cash-flow, budget progress, export, and dashboard totals contain only
  the current user's rows.
- Invalid and unknown payload fields return the documented error shape.

## Ledger, Budgets, And Goals

- Create, edit, paginate, filter, and delete manual income and expenses.
- Confirm all pages contribute to dashboard and cash-flow totals.
- Confirm transfers remain visible but do not inflate operating inflow,
  outflow, net cash flow, or savings rate.
- Confirm only EUR is accepted into current totals; no implicit FX conversion
  occurs.
- Test daily, weekly, monthly, and annual budgets at exact period boundaries.
- Confirm budget progress uses matching EUR expenses and category only.
- Test goal create/edit/progress/status/delete and confirm it does not imply
  money movement.
- Test empty, zero-income, negative-net, and no-expense cash-flow states.

## Read-Only Bank Import

When bank connections are enabled, test with approved production-like provider
credentials and a disposable account:

- Institution list and picker for each supported launch country.
- Consent success, cancellation, rejection, malformed callback, and expiry.
- Initial import, incremental import, and immediate duplicate import.
- Pending transaction storage and later promotion to one booked ledger row.
- Inflow, outflow, transfer, unsupported-currency, and missing-description data.
- Current and available EUR balance snapshots.
- Concurrent manual imports produce one lease winner.
- Timeout, `429`, provider `5xx`, and expired-access state/error mapping.
- Scheduled sync respects due times, batch limits, and disabled configuration.
- Reconnect revokes old access and preserves the local connection identity.
- Disconnect and full account deletion revoke provider access.

Confirm imported data remains read-only and the UI never claims payment,
account-control, or universal institution-history capabilities.

## Browser And Accessibility

- Test current Chrome, Firefox, Safari, and Edge targets on desktop and mobile
  viewport sizes.
- Check sign-up, login, reset, dashboard, ledger, budgets, goals, bank picker,
  profile, security, export, and deletion with keyboard only.
- Confirm focus indication, labels, error announcements, contrast, zoom to 200
  percent, larger text, reduced motion, and high-contrast preference behavior.
- Confirm long names, institutions, amounts, and translated/locale-formatted
  values do not overlap or leave controls unusable.
- Confirm loading, empty, offline, unauthorized, validation, rate-limit, and
  generic server-error states are understandable and recoverable.
- Treat receipt scanning as a mock review feature until a secure production
  upload/OCR backend is implemented.

## Production Operations

- Verify final-hostname HTTPS, DNS, CORS, CSRF, cookies, proxy trust, and
  security headers from outside the deployment network.
- Verify secrets are injected from the platform store and absent from Git,
  images, logs, and frontend assets.
- Confirm database encryption, private networking, least privilege, automated
  backups, point-in-time recovery, and a successful isolated restore drill.
- Confirm liveness/readiness, `5xx`, latency, restart, database, auth-abuse,
  SMTP, and bank-sync alerts reach a human.
- Confirm SMTP SPF, DKIM, DMARC, bounces, and verification/reset links.
- Review privacy policy, terms, consent/provider copy, support route,
  subprocessors, data region, retention, and incident contacts.
- Record release image digests, migration result, rollback target, test evidence,
  approver, and go/no-go decision.
