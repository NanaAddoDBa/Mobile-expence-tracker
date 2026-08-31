# Expense Tracker API

NestJS and PostgreSQL API for the Expense Tracker & Budget Manager. It owns
authentication, user isolation, profile/privacy workflows, income, expenses,
cash flow, budgets, goals, and read-only bank import.

## Setup

From the repository root:

```powershell
npm.cmd --prefix server ci
Copy-Item server/.env.example server/.env
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
npm.cmd run dev:api
```

The API listens on `http://localhost:4000` by default. Do not commit
`server/.env`. Development values are documented in `server/.env.example`;
the production contract is in `server/.env.production.example`.

## Authentication

The API supports:

- Password registration and login
- Google ID-token authentication
- Email verification
- Password reset with single-use, expiring tokens
- Password change with other-session revocation
- Active session listing and individual revocation
- Sign out and sign out everywhere

The browser receives an opaque `HttpOnly`, `SameSite=Lax` session cookie. Only
the SHA-256 token hash is stored. Unsafe requests require a signed
double-submit CSRF token. Passwords use bcrypt; production requires at least 10
rounds. Recovery and verification tokens are hashed at rest.

Google ID tokens are verified for signature, issuer, expiry, audience, and
verified email. Google tokens are never persisted. Matching an existing
password account by email does not automatically link identities.

Password accounts must verify their email before connecting, reconnecting, or
syncing a bank.

## Main Routes

All paths use the `/api` prefix.

```text
GET    /health
GET    /health/live
GET    /health/ready

GET    /auth/csrf
POST   /auth/register
POST   /auth/login
POST   /auth/google
POST   /auth/logout
GET    /auth/me
POST   /auth/email-verification/request
POST   /auth/email-verification/confirm
POST   /auth/password-reset/request
POST   /auth/password-reset/confirm
GET    /auth/sessions
DELETE /auth/sessions/:sessionId
POST   /auth/change-password
POST   /auth/logout-all

GET    /profile
PATCH  /profile
PATCH  /profile/settings
GET    /profile/export
DELETE /profile

GET|POST           /incomes
GET|PATCH|DELETE   /incomes/:id
GET|POST           /expenses
GET|PATCH|DELETE   /expenses/:id
GET                /cash-flow/summary
GET|POST           /budgets
GET|PATCH|DELETE   /budgets/:id
GET|POST           /goals
GET|PATCH|DELETE   /goals/:id

GET    /connected-accounts
GET    /connected-accounts/institutions
POST   /connected-accounts/link/start
GET    /connected-accounts/link/callback
POST   /connected-accounts/:id/import
POST   /connected-accounts/:id/reconnect
GET    /connected-accounts/:id
DELETE /connected-accounts/:id
```

Authentication is required for all profile, ledger, budget, goal, cash-flow,
and connected-account routes. Controllers derive ownership from the validated
session; clients never choose `userId`.

## Financial Rules

- Money is stored as integer minor units.
- Current ledger totals accept EUR only.
- Income and expense transfers are excluded from operating cash flow.
- Savings rate is `net cash flow / inflow * 100` and is `null` with no inflow.
- Budget keys use `YYYY-MM-DD` for daily, ISO `YYYY-Www` for weekly,
  `YYYY-MM` for monthly, and `YYYY` for annual periods.
- A goal cannot record savings above its target.

List endpoints paginate up to 100 rows per page. The frontend follows all pages
before computing client-side views.

## Bank Import

GoCardless Bank Account Data is used for read-only account information. The
server stores application credentials only in environment configuration; bank
credentials are handled by the institution/provider and never enter this app.

The implemented lifecycle includes:

- Institution discovery and hosted consent
- Requisition status checks and consent expiry
- External account details and EUR balance snapshots
- Manual and optional six-hour scheduled sync
- Database sync leases to prevent overlapping imports
- Transaction date overlap windows
- Pending transaction staging without ledger impact
- Promotion to income or expense after booking
- Provider transaction ID and hash-based duplicate protection
- Import batches and account sync run records
- Rate-limit and temporary-error retry handling
- Reconnect and provider requisition deletion
- Provider revocation before connected-account or user deletion

Set `BANK_CONNECTIONS_ENABLED=true` only when GoCardless credentials are
configured. Set `BANK_SYNC_ENABLED=true` separately to enable scheduled sync.

## Privacy

`GET /profile/export` returns user-owned application data but excludes password
hashes, session token hashes, recovery token hashes, and environment secrets.

`DELETE /profile` requires the literal confirmation `DELETE`. It revokes
provider access, deletes the user and cascading owned data, and clears the
session cookie. Imported ledger entries are retained when only a connected
account is removed because their source relation becomes null.

Expired sessions and account tokens are cleaned daily. Audit retention defaults
to 365 days and is configurable.

## Operations

`GET /api/health/live` reports process liveness. `GET /api/health/ready` also
executes a PostgreSQL query and returns `503` when the database is unavailable.

Every HTTP response receives an `X-Request-ID`. Access logs are structured JSON
with method, path, status, request ID, and duration. Unexpected errors return a
generic response and are logged server-side without request bodies or secrets.

Production startup validates HTTPS origins, secure cookies, proxy trust, CSRF
secret strength, database configuration, SMTP, bounded timeouts, and optional
bank credentials. The API refuses to start when that contract is invalid.

The production image in `server/Dockerfile` applies committed migrations before
starting `dist/main.js`. See `docs/production-runbook.md` for deployment,
backups, restore drills, rollback, monitoring, and incident operations.

## Commands

```powershell
npm.cmd run db:format
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
npm.cmd run build:api
npm.cmd run test:api -- --runInBand
npm.cmd run test:e2e:api -- --runInBand
npm.cmd --prefix server audit
```

The receipt/OCR backend and app-level two-factor authentication are not
implemented. The API cannot initiate payments or move money.
