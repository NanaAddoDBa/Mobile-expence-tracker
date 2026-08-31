# Production Runbook

This runbook describes the repository-supported path to production. It does not
claim that a public deployment or external provider approval currently exists.

## Target Architecture

```text
Browser
  -> HTTPS load balancer or reverse proxy
  -> Nginx web container
       -> static React application
       -> same-origin /api proxy
  -> NestJS API container
  -> managed PostgreSQL with TLS, automated backups, and point-in-time recovery

External services:
  -> SMTP provider for verification and recovery email
  -> GoCardless Bank Account Data for read-only bank access
  -> Google Identity Services when Google sign-in is enabled
  -> log/error monitoring and uptime checks
```

The API and web containers may run on any platform that supports OCI images,
health checks, TLS ingress, secret injection, and private database networking.

## Required Provisioning

Provision these resources before the first release:

1. A production PostgreSQL database in the intended legal/data region.
2. Encrypted database storage, TLS connections, automated backups, and
   point-in-time recovery where available.
3. A secret manager or platform secret store.
4. An SMTP provider with a verified sending domain and monitored bounce path.
5. A GoCardless Bank Account Data production account if bank sync will launch.
6. A Google web OAuth client and production-ready consent configuration if
   Google sign-in will launch.
7. DNS and a TLS certificate for the public app origin.
8. Central logs, error reporting, uptime checks, and an alert destination.

Use `server/.env.production.example` as the configuration checklist. Do not
create a populated production environment file in the repository or image.

## Environment Gate

Production startup fails when required security settings are absent or unsafe.
At minimum configure:

- `NODE_ENV=production`
- `DATABASE_URL` with PostgreSQL TLS parameters
- `FRONTEND_ORIGIN`, `APP_PUBLIC_URL`, and `PUBLIC_API_URL` using HTTPS
- `COOKIE_SECURE=true`
- `TRUST_PROXY` for the exact platform proxy topology
- a unique `CSRF_SECRET` of at least 32 characters
- `BCRYPT_ROUNDS` from 10 through 15
- `SMTP_HOST` and `EMAIL_FROM`
- `BANK_CONNECTIONS_ENABLED=true` or `false` explicitly

When bank connections are enabled, `GOCARDLESS_SECRET_ID` and
`GOCARDLESS_SECRET_KEY` are mandatory. Enable `BANK_SYNC_ENABLED` only after
the provider account, rate limits, and monitoring are ready.

Treat `GOOGLE_CLIENT_ID` as public client configuration, but keep its allowed
origins restricted. SMTP credentials, database credentials, CSRF secret, and
GoCardless keys are secrets.

## Build and Release

CI in `.github/workflows/ci.yml` installs locked dependencies, validates Prisma,
applies migrations to PostgreSQL, audits production dependencies, and runs all
API/frontend checks.

Tagged releases or a manual release workflow publish:

```text
ghcr.io/nanaaddodba/mobile-expence-tracker-api
ghcr.io/nanaaddodba/mobile-expence-tracker-web
```

The web client ID is a build-time value:

```text
Repository variable: VITE_GOOGLE_CLIENT_ID
```

No private secret is passed to the web build.

## Deployment Sequence

1. Confirm CI is green for the exact commit.
2. Take or verify a recent database backup before schema changes.
3. Deploy the API image with production secrets and no public traffic.
4. Let the image run `prisma migrate deploy`.
5. Confirm `GET /api/health/live` returns `200`.
6. Confirm `GET /api/health/ready` returns `200` and database `ok`.
7. Deploy the web image with `API_UPSTREAM` pointing to the private API.
8. Route a staging hostname to the web service.
9. Run the release checklist and provider callback tests.
10. Shift production traffic gradually and watch error, latency, and database
    metrics.

The API image currently applies migrations before startup. Platforms with
multiple concurrent replicas may instead run `npm run prisma:migrate:deploy` as
a single release job, then start replicas with `npm run start:prod`.

## Provider Configuration

### Google

- Set the exact HTTPS app origin as an Authorized JavaScript origin.
- Configure branding, audience, support contact, privacy policy, and terms.
- Complete any Google verification required for the chosen audience.
- Put the same client ID in the web build variable and API environment.
- Verify popup sign-in on the final hostname.

This implementation uses the browser callback credential and does not require a
client secret or redirect URI.

### GoCardless

- Use production Bank Account Data credentials, not sandbox credentials.
- Set `PUBLIC_API_URL` to the browser-reachable HTTPS origin.
- Confirm the callback path is
  `/api/connected-accounts/link/callback`.
- Test at least one supported institution, cancellation, rejected consent,
  expired consent, reconnect, rate limiting, and provider disconnect.
- Confirm scheduled sync volume fits institution endpoint limits.

The integration is account-information-only. It must not be represented as a
payment or money-control capability.

### SMTP

- Verify SPF, DKIM, and DMARC for the sending domain.
- Use a transactional sender address that receives operational replies.
- Test verification and reset links on the final HTTPS origin.
- Monitor rejects, bounces, and delivery latency.
- Rotate SMTP credentials through the secret manager.

## Health and Monitoring

Monitor:

- `/api/health/live` for process availability
- `/api/health/ready` for database readiness
- HTTP `5xx` rate and p95/p99 latency
- authentication `401`/`403`/`429` changes
- PostgreSQL CPU, storage, connections, locks, and replication health
- failed and rate-limited `AccountSyncRun` records
- connections in `NEEDS_RECONNECT`
- SMTP delivery failures
- container restarts and migration failures

Logs include structured `http_request` events with request ID, method, path,
status, and duration. Do not add passwords, cookies, CSRF tokens, recovery
tokens, full bank payloads, or environment values to logs.

Suggested initial alerts:

- readiness fails for 2 consecutive minutes
- `5xx` exceeds 2 percent for 5 minutes
- p95 API latency exceeds 2 seconds for 10 minutes
- database storage exceeds 80 percent
- no successful scheduled bank syncs during an expected 12-hour window
- SMTP delivery failures exceed the provider baseline

## Backup Policy

Use managed PostgreSQL backups where possible:

- daily automated backups
- encrypted backup storage
- at least 30 days of retention, subject to the final privacy policy
- point-in-time recovery for operational mistakes
- cross-zone durability
- access restricted to production operators

Backups can temporarily retain data deleted from primary tables. State that
window in the user privacy notice and ensure expired backups are deleted by the
provider.

An optional manual logical backup is:

```powershell
pg_dump --format=custom --no-owner --file expense-tracker.backup $env:DATABASE_URL
```

Store manual backups encrypted outside developer workstations and delete them
according to policy.

## Restore Drill

Run a restore drill before launch and at least quarterly:

1. Create an isolated empty PostgreSQL database.
2. Restore the latest backup into that database.
3. Run `prisma migrate status` and `prisma migrate deploy` against it.
4. Start an API instance pointed only at the restored database.
5. Confirm readiness and representative login, ledger, budget, goal, export,
   and bank-history reads.
6. Compare record counts and recent timestamps with the backup manifest.
7. Record recovery time and recovery point achieved.
8. Destroy the isolated environment and its secrets.

Example restore command:

```powershell
pg_restore --no-owner --dbname $env:RESTORE_DATABASE_URL expense-tracker.backup
```

Never test a destructive restore against the active production database.

## Rollback

Application rollback:

1. Stop traffic expansion.
2. Re-deploy the previously known-good API and web image tags.
3. Verify liveness, readiness, and a read-only smoke flow.
4. Monitor error and latency recovery.

Database rollback:

- Do not run `prisma migrate reset` in production.
- Prefer a forward corrective migration.
- If a destructive migration requires point-in-time restore, declare an
  incident, stop writes, restore into a new database, validate, and switch
  connection configuration deliberately.

Every destructive migration needs a reviewed backup and rollback plan before
release.

## Security Operations

- Review production dependencies and image scan results for every release.
- Rotate database, SMTP, CSRF, and GoCardless secrets on a documented schedule
  and immediately after suspected exposure.
- Revoking the CSRF secret invalidates CSRF cookies but not login sessions.
- Database credential rotation must update all API replicas atomically.
- Review audit events and unusual session activity during incidents.
- Keep `TRUST_PROXY` aligned with the actual ingress topology so IP-based rate
  limiting cannot be spoofed.
- Patch Node, Nginx, PostgreSQL, and base images routinely.

## Privacy Operations

- User export is available at `GET /api/profile/export`.
- User deletion is available at `DELETE /api/profile` with confirmation.
- Provider requisitions are revoked before account deletion completes.
- Primary user data cascades from the `User` row.
- Expired auth records are cleaned daily.
- Audit records default to 365 days and backups follow the backup retention
  window.

Verify the final privacy notice, controller/operator roles, subprocessor list,
data region, retention periods, and user contact route with qualified legal
review before public use.

## Launch Gate

Do not declare the app live until all are true:

- CI passes on the release commit.
- Production dependency and image scans have no accepted critical/high issues.
- Migrations succeed on staging and production backup is current.
- HTTPS, security headers, secure cookies, and exact origins are verified.
- Registration, verification, login, reset, logout, and session revocation pass.
- User isolation tests pass for income, expenses, budgets, goals, and banks.
- Export and deletion pass, including provider revocation.
- GoCardless production consent, import, pending, duplicate, reconnect, and
  disconnect flows pass when bank sync is enabled.
- Backups and an isolated restore drill are verified.
- Uptime, error, database, sync, and email alerts reach a human.
- Privacy policy, terms, provider disclosures, support route, and incident
  contacts are published.
- A final accessibility and browser/mobile QA pass is complete.

Repository-declared controls are evidence of implementation, not evidence that
the external production environment has been configured or verified.
