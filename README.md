# Expense Tracker & Budget Manager

A full-stack personal finance application for tracking income and expenses,
monitoring net cash flow and savings rate, managing daily, weekly, monthly, and
annual budgets, following savings goals, and importing read-only bank data.

The repository now contains a production-capable application foundation. It is
packaged and testable, but it is not currently deployed to a public production
environment. Launch still requires hosted services, production credentials,
DNS, TLS, monitoring, and a successful release checklist.

## What Works

- Password registration and sign-in with HTTP-only database sessions.
- Google Identity Services sign-in with server-side ID-token verification.
- Email verification, password reset, password change, active-session review,
  single-session revocation, and sign-out everywhere.
- User-owned income and expense CRUD with full-ledger pagination.
- Net cash flow, transfer-aware totals, and savings-rate calculations.
- Daily, weekly, monthly, and annual category budgets.
- Savings goals and contribution progress.
- Read-only GoCardless Bank Account Data connection and institution picker.
- Manual and scheduled transaction sync with inflow/outflow classification.
- Pending transaction staging, duplicate protection, consent expiry handling,
  reconnect flow, sync leases, sync audit records, and balance snapshots.
- Server-backed profile settings, JSON data export, and account deletion.
- Provider consent revocation before connected-account or user deletion.
- CSRF protection, rate limiting, security headers, request IDs, structured
  access logs, database readiness, and scheduled retention cleanup.

## Product Boundary

The app reads and organizes financial information. It does not initiate
payments, move money, block card transactions, hold funds, provide investment
services, or provide tax, legal, or regulated financial advice.

The receipt scan remains a mock/local workflow. Mock mode and local sample data
remain available for development, but HTTP API mode is the default outside
tests. Financial totals currently use EUR only; non-EUR bank transactions are
not mixed into EUR totals.

App-level two-factor authentication is not implemented. Google accounts can use
provider-managed multi-factor protection; password accounts use verified email,
strong password hashing, recovery links, and revocable server sessions.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS, D3, and Vitest
- NestJS 11, Prisma 6, PostgreSQL 16, Jest, and Supertest
- Cookie sessions, signed double-submit CSRF, Helmet, and request throttling
- GoCardless Bank Account Data and Google Identity Services
- Multi-stage Docker images, Nginx same-origin API proxy, and GitHub Actions

## Local Setup

Install both dependency trees:

```powershell
npm.cmd ci
npm.cmd --prefix server ci
```

Create the backend environment file:

```powershell
Copy-Item server/.env.example server/.env
```

Set `DATABASE_URL` in `server/.env`, then apply all committed migrations:

```powershell
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:migrate:deploy
```

Run the API and frontend in separate terminals:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend proxies
`/api` to `http://127.0.0.1:4000` in development, so both processes must be
running.

### Local Compose

The repository also includes an isolated local stack:

```powershell
npm.cmd run compose:up
```

It serves the app on `http://localhost:3000`, the API on port `4000`, and its
Compose PostgreSQL instance on host port `5434`. This avoids the existing
standalone local database on port `5433`.

Stop that stack with `npm.cmd run compose:down`.

## External Integrations

Google sign-in requires the same web client ID in:

```ini
# .env.local
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# server/.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Authorize the exact frontend origin in Google Cloud. Production use also
requires the OAuth consent screen and publishing status to be ready for the
intended users.

Real bank connections require:

```ini
BANK_CONNECTIONS_ENABLED=true
GOCARDLESS_SECRET_ID=...
GOCARDLESS_SECRET_KEY=...
PUBLIC_API_URL=http://localhost:4000
```

Enable background sync separately with `BANK_SYNC_ENABLED=true`. The default
interval is six hours to respect institution-specific rate limits.

Password recovery and verification require SMTP configuration. Account creation
still succeeds in development when SMTP is absent, but production configuration
validation requires an email delivery service.

## Validation

Run the complete local verification sequence:

```powershell
npm.cmd run db:format
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run build:api
npm.cmd run test:api -- --runInBand
npm.cmd run test:e2e:api -- --runInBand
npm.cmd run lint
npm.cmd run lint:styles
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd audit
npm.cmd --prefix server audit
```

Health endpoints:

```text
GET /api/health
GET /api/health/live
GET /api/health/ready
```

`/ready` returns success only when PostgreSQL responds.

## Production

The API image is defined in `server/Dockerfile`; the web image is defined in
the root `Dockerfile`. The API image applies committed Prisma migrations before
starting. The web image serves the compiled SPA through Nginx and proxies
`/api` to the API service on the same browser origin.

Use `server/.env.production.example` as a checklist, store values in the
deployment platform's secret manager, and never commit a populated production
environment file. Tagged releases can publish both images through
`.github/workflows/release-images.yml`.

Deployment, backup, restore, rollback, monitoring, and launch procedures are in
`docs/production-runbook.md`.

## Documentation

- `server/README.md`: API setup, behavior, and endpoint summary
- `docs/backend-api-contract.md`: implemented HTTP contract
- `docs/backend-data-model.md`: current persistence model
- `docs/open-banking-sync-strategy.md`: bank sync lifecycle and invariants
- `docs/privacy-and-consent.md`: data ownership, export, deletion, and retention
- `docs/security-baseline.md`: implemented security controls and open risks
- `docs/production-runbook.md`: production deployment and operations
- `docs/qa-checklist.md`: release verification

## Remaining Launch Work

Repository work cannot provision or approve external services by itself. Before
public launch, complete the hosted PostgreSQL, SMTP, GoCardless production
access, Google production configuration, secret manager, DNS/TLS, error
monitoring, uptime checks, backup retention, and restore drill described in the
runbook. Real OCR and app-level two-factor authentication remain post-launch
features unless they are made explicit launch requirements.

## Repository

```text
https://github.com/NanaAddoDBa/Mobile-expence-tracker.git
```

## License

No license has been selected yet. Choose one before distributing or accepting
external contributions.
