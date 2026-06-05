# Security Baseline

The backend should start with a small, enforceable security baseline. Security should be part of the first real backend milestone, not an end-stage hardening pass.

## Authentication and Sessions

Recommended options:

- Trusted hosted auth provider.
- Custom backend auth with secure HTTP-only cookies.

If cookie sessions are used:

- Use HTTP-only cookies.
- Use secure cookies in production.
- Use same-site protection.
- Add CSRF protection for state-changing requests.
- Rotate session secrets safely.

## Authorization

Every user-owned resource must be checked server-side.

Rules:

- Never trust user IDs from the request body.
- Use the authenticated session user.
- Scope every query by authenticated `userId`.
- Return not found or forbidden consistently for resources the user does not own.

## Input Validation

Validate all state-changing requests server-side:

- Expenses.
- Budgets.
- Goals.
- Settings.
- Receipt uploads.
- Account connection callbacks.
- Data export and deletion requests.

Reject invalid dates, invalid currency codes, negative values where not allowed, oversized strings, and unsupported enum values.

## Secrets and Tokens

Secrets must not be stored in source control or browser storage.

Provider tokens must be:

- Stored only on the backend.
- Encrypted at rest.
- Excluded from logs.
- Deleted when connection access is removed.

## Logging

Logs should help operate the system without leaking sensitive data.

Do not log:

- Passwords.
- Session tokens.
- Provider access tokens.
- Provider refresh tokens.
- Raw bank credentials.
- Full receipt images.
- Unnecessary personal data.

Use structured log context with stable IDs where possible.

## Audit Logs

Record audit events for sensitive actions:

- Login.
- Logout.
- Data export.
- Account data deletion.
- Connected account created.
- Connected account removed.
- Provider consent changed.
- Receipt file uploaded.
- Import run completed or failed.

Audit logs should include who performed the action, when it happened, what category of action occurred, and enough metadata to investigate safely.

## File Uploads

Receipt upload rules:

- Limit file size.
- Validate MIME type.
- Validate extension where useful.
- Store files outside the application server filesystem.
- Use private object storage by default.
- Generate short-lived access URLs when needed.
- Scan files for malware if practical before production.

## Operational Controls

Production should include:

- Rate limiting.
- Error monitoring.
- Uptime checks.
- Database backups.
- Backup restore testing.
- Environment separation.
- Incident response notes.
- Dependency update routine.
