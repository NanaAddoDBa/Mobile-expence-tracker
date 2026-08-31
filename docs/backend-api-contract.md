# Backend API Contract

This document describes the implemented HTTP API. All routes use the `/api`
prefix.

## Shared Rules

- JSON request and response bodies use UTF-8.
- Successful application responses use `{"data": ...}`.
- Paginated responses also include `meta.page`, `meta.pageSize`,
  `meta.totalItems`, and `meta.totalPages`.
- Errors use a stable code, message, timestamp, and optional request ID.
- Unknown request fields are rejected.
- User-owned resources are always scoped by the authenticated session.
- Clients never send `userId` for an ownership decision.
- Money uses positive integer minor units and currently accepts EUR only.
- Dates use ISO strings; date-only query values use `YYYY-MM-DD`.

Example error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["amountMinor must be a positive number"],
    "requestId": "request-123",
    "timestamp": "2026-08-30T00:00:00.000Z"
  }
}
```

## Session and CSRF

Authentication uses the `exp_tracker_session` cookie. It is `HttpOnly`,
`SameSite=Lax`, path `/`, and `Secure` in production. Only its hash is stored.

Before an unsafe request, obtain:

```text
GET /auth/csrf
```

The response includes `data.csrfToken` and sets the signed CSRF cookie. Send the
token as `X-CSRF-Token` on `POST`, `PATCH`, `PUT`, and `DELETE` requests.

## Health

```text
GET /health
GET /health/live
GET /health/ready
```

The first two report process liveness. `/health/ready` executes a PostgreSQL
query and returns `503` when the database is unavailable.

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/logout
GET  /auth/me
```

Registration accepts `email`, `password`, and optional `name`. Login accepts
`email` and `password`. Google accepts a Google Identity Services
`credential`. Successful authentication sets the session cookie.

The safe auth user contains `id`, `email`, nullable `name`, `status`,
`createdAt`, and `updatedAt`. Password hashes, token hashes, identity subjects,
and login metadata are excluded.

```text
POST /auth/email-verification/request
POST /auth/email-verification/confirm
POST /auth/password-reset/request
POST /auth/password-reset/confirm
```

Verification request requires authentication. Confirmation accepts a token.
Password-reset request always returns generic success so it does not disclose
whether an email exists. Reset confirmation accepts a single-use token and new
password, changes the password, and revokes all active sessions.

```text
GET    /auth/sessions
DELETE /auth/sessions/:sessionId
POST   /auth/change-password
POST   /auth/logout-all
```

Session entries expose ID, user agent, IP address, creation, expiry, and whether
the entry is current. A user cannot revoke the current session through the
single-session route; normal logout handles it. Password change requires the
current password and revokes other sessions.

Auth and recovery endpoints have tighter rate limits than the global API limit.

## Profile and Privacy

```text
GET    /profile
PATCH  /profile
PATCH  /profile/settings
GET    /profile/export
DELETE /profile
```

The profile response includes identity display fields, email verification
timestamp, account creation timestamp, appearance/accessibility settings, and
notification preferences.

`PATCH /profile` changes the display name. `PATCH /profile/settings` accepts
supported theme, currency, language, accessibility, and notification values.

Export returns `exportVersion`, `generatedAt`, and the authenticated user's
owned data. It excludes password hashes, session token hashes, account recovery
token hashes, and environment/provider secrets.

Account deletion requires:

```json
{ "confirmation": "DELETE" }
```

The service revokes GoCardless requisitions first, deletes the user and
cascading owned data, clears the cookie, and returns `data.success=true`.

## Income and Expenses

```text
GET    /incomes
POST   /incomes
GET    /incomes/:id
PATCH  /incomes/:id
DELETE /incomes/:id

GET    /expenses
POST   /expenses
GET    /expenses/:id
PATCH  /expenses/:id
DELETE /expenses/:id
```

List routes support `page` and `pageSize`. They return only EUR records owned by
the current user. Create/update DTOs validate amount, date, category, payment
method, recurring metadata, and optional text. Manual endpoints cannot forge
connected-account ownership metadata.

Another user's record is returned as not found rather than exposed.

## Cash Flow

```text
GET /cash-flow/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The aggregate is calculated over all matching database rows, not one list page.
It reports operating inflow, operating outflow, net cash flow, savings rate,
transfer inflow/outflow, counts, category totals, and date range.

Transfer-category rows are excluded from operating inflow, outflow, net cash
flow, and savings rate. Savings rate is `null` when operating inflow is zero.

## Budgets

```text
GET    /budgets
POST   /budgets
GET    /budgets/:id
PATCH  /budgets/:id
DELETE /budgets/:id
```

Budgets use `category`, `limitAmountMinor`, `period`, and `periodKey`. Supported
periods and keys:

```text
daily   -> YYYY-MM-DD
weekly  -> ISO YYYY-Www
monthly -> YYYY-MM
annual  -> YYYY
```

A user can have one budget per category, period, and period key.

## Goals

```text
GET    /goals
POST   /goals
GET    /goals/:id
PATCH  /goals/:id
DELETE /goals/:id
```

Goals contain name, target amount, current amount, optional target date, and
status. Current amount cannot exceed target. Reaching the target completes the
goal.

## Connected Accounts

```text
GET    /connected-accounts
GET    /connected-accounts/institutions?country=DE
POST   /connected-accounts/link/start
GET    /connected-accounts/link/callback?connectionId=...
POST   /connected-accounts/:id/import
POST   /connected-accounts/:id/reconnect
GET    /connected-accounts/:id
DELETE /connected-accounts/:id
```

Bank connection, callback completion, reconnect, and sync require a verified
email. Provider operations can be disabled per deployment.

Start accepts `institutionId` and optional `userLanguage` and returns the local
connection plus GoCardless consent URL. The callback validates ownership and
provider status, stores external accounts, and redirects to the configured
frontend with `bankConnection=completed` or `bankConnection=failed`.

Import:

- acquires an expiring database lease
- records an `AccountSyncRun` and `ImportBatch`
- re-checks requisition/consent status
- fetches a bounded transaction window
- stages pending transactions without creating ledger entries
- imports newly booked outflows as expenses and inflows as income
- skips duplicate provider transactions atomically
- records EUR current/available balance snapshots
- updates next scheduled sync and error state

The result includes import and sync IDs, booked expense/income counts, pending
count, duplicate count, failure count, and a user-facing message.

Reconnect revokes the old requisition and creates a fresh consent flow on the
same local connection. Delete revokes provider access before deleting local
connection metadata. Existing imported income/expenses remain historical rows
with a nullable source relation.

## Status Codes

- `200`: successful read/update/action
- `201`: successful resource creation where configured
- `400`: invalid input or invalid token state
- `401`: missing/invalid session
- `403`: CSRF failure, disabled account, unverified email, or forbidden action
- `404`: resource does not exist for the current user
- `409`: conflict, incomplete consent, expired consent, or overlapping sync
- `429`: request throttled
- `500`: unexpected internal failure with a generic body
- `503`: database/provider/configured capability unavailable

Every response includes `X-Request-ID`. Clients may send a safe request ID using
letters, digits, period, underscore, colon, and hyphen up to 128 characters;
unsafe values are replaced.
