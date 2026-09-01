# Security Baseline

This document records controls implemented in the repository and the external
security work required before a public launch. It is not a certification or a
substitute for a production security review.

## Authentication

- Passwords are hashed with bcrypt; production cost is bounded from 10 through
  15 rounds and defaults to 12.
- Sessions use opaque random tokens. PostgreSQL stores a hash, not the raw
  token.
- The session cookie is HTTP-only, `SameSite=Lax`, path `/`, and `Secure` in
  production.
- Registration starts email verification. Verification and password-reset
  tokens are hashed, expiring, and single-use.
- Password reset responses do not disclose whether an address exists.
- Users can review active sessions, revoke another session, change a password,
  or revoke all sessions.
- Google ID credentials are verified server-side against the configured web
  client ID, verified-email claim, issuer, audience, and stable provider
  subject. Google tokens are not persisted.
- A Google identity is not attached to an existing password user merely because
  both present the same email address.
- Connected-bank routes require an authenticated, email-verified user.

App-level two-factor authentication is not implemented. A production risk
assessment must decide whether it is required for the target users; Google
accounts may rely on the security configured at Google, while password accounts
currently remain single-factor.

## Request Protection

- A signed double-submit CSRF token is required for every non-safe HTTP method.
- CORS allows credentials only for explicitly configured frontend origins.
- Helmet supplies API security headers; the Nginx web image adds CSP,
  `X-Content-Type-Options`, cross-origin opener, referrer, and permissions
  policies.
- Request bodies, request duration, header duration, and keep-alive duration are
  bounded.
- DTO validation strips no unknown fields silently: unrecognized fields are
  rejected and expected values are validated.
- Global request throttling defaults to 120 requests per minute, with tighter
  limits on registration, login, Google auth, verification, reset, password
  change, and bank import/link operations.
- Request IDs are accepted/generated, returned to the client, and included in
  structured access logs.
- Unexpected server errors return a generic response with a request ID; the
  internal exception is logged server-side.
- `TRUST_PROXY` is mandatory in production so secure cookies, request IPs, and
  IP throttling use the intended ingress topology.

The built-in rate limiter uses process-local storage. A multi-replica public
deployment must add an ingress/WAF or shared rate-limit store so limits cannot
be multiplied by the replica count.

## Authorization And Data Isolation

- Authentication derives the user from the session cookie.
- Services include `userId` in reads, updates, deletes, aggregates, and import
  uniqueness decisions.
- Resource IDs alone never authorize access.
- Cash-flow and budget calculations use only the authenticated user's EUR
  ledger rows.
- Provider callbacks resolve only the locally created requisition reference and
  do not accept a client-selected owner.

These invariants are covered by service and API tests, but staging should also
run a two-user isolation smoke test against the deployed database.

## Provider And Secret Handling

- Database, SMTP, CSRF, and GoCardless credentials are server-only environment
  secrets and are excluded from Git and container build context.
- GoCardless access tokens are cached in API memory and are not sent to the
  browser or stored in PostgreSQL.
- Provider calls use timeouts, bounded retries for idempotent operations, and
  sanitized error mapping.
- Disconnect and account deletion revoke the provider requisition.
- Production startup fails when required URLs, secure cookies, proxy trust,
  CSRF entropy, SMTP configuration, database URL, or enabled bank credentials
  are absent or malformed.

Use a managed secret store, narrowly scoped runtime identity, private database
networking, TLS, encryption at rest, and a documented rotation procedure.
Never put populated production environment files in the repository or image.

## Runtime And Supply Chain

- CI performs locked installs, Prisma validation/generation/migration, backend
  and frontend tests, lint/type checks/builds, and production dependency audits.
- API and web services build as separate OCI images with non-development
  runtimes; the API runs as a non-root Node user behind `dumb-init`.
- Liveness and database-readiness endpoints support orchestration health checks.
- The API enables graceful Nest shutdown hooks.

Before release, scan source, dependencies, built images, and infrastructure
configuration. Pin approved image versions, protect the release workflow,
require branch review/checks, and establish patch timelines for Node, Nginx,
PostgreSQL, and base images.

## Logging, Audit, And Retention

Do not log passwords, cookies, CSRF or recovery tokens, provider secrets, full
bank payloads, or environment values. Central logs should restrict access and
use a retention period matching the production privacy policy.

Sensitive account actions generate audit rows. Daily cleanup defaults to 7 days
for old used auth tokens, 30 days for expired/revoked sessions, and 365 days for
audit logs.

## Remaining Launch Checks

- External penetration/security review and threat-model review.
- Managed database TLS, backups, point-in-time recovery, and successful restore
  drill.
- HTTPS, headers, cookies, CSRF, CORS, and proxy behavior on the final hostname.
- Shared or ingress-level rate limiting for multi-replica deployment.
- SMTP domain authentication and recovery-email abuse monitoring.
- GoCardless production approval, callback testing, and provider-key rotation.
- Google production consent/origin review.
- Central error, uptime, database, auth-abuse, and bank-sync alerts.
- Dependency and image scan review for the exact release artifacts.
- Decision and documentation for app-level 2FA risk.

Repository-declared controls prove implementation, not that the deployed
environment or its operations have been independently verified.
