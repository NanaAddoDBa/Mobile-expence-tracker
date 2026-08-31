# Backend V1 Milestone Record

This document preserves the original Backend V1 milestone boundary. That
milestone is complete and the repository has since advanced beyond it. Use
`backend-api-contract.md`, `backend-data-model.md`, and
`production-runbook.md` for the current implementation.

## Original Goal

Backend V1 replaced local mock persistence with a user-owned NestJS,
PostgreSQL, and Prisma backend:

```text
A user can sign up, log in, add expenses, create budgets, create goals, update
settings, export their data, delete their account, and see only their own data
persisted in PostgreSQL.
```

## Completed V1 Scope

- Password registration, login, logout, current-user session, and authorization.
- User profile and server-backed settings.
- Expense, budget, and goal CRUD.
- Daily, weekly, monthly, and annual budget periods.
- Data export and account deletion.
- Audit logging for sensitive actions.
- DTO validation and stable API response/error conventions.
- User-scoped service queries and ownership tests.
- Prisma schema, migrations, unit tests, and API integration tests.
- HTTP-backed frontend API clients.

## Work Added After V1

- Income CRUD, full-ledger pagination, net cash flow, and savings rate.
- Google sign-in, email verification, password recovery/change, and session
  review/revocation.
- Read-only GoCardless institution selection, consent, account discovery,
  transaction import, pending/booked handling, balances, reconnect, disconnect,
  scheduled sync, and provider revocation.
- Production environment validation, CSRF, security headers, rate limits,
  request IDs, structured access logs, health checks, and retention cleanup.
- API/web container images, local Compose, CI, release-image workflow, and a
  production runbook.

## Still Outside The Implemented Backend

- Payment initiation, money movement, card controls, or banking credentials.
- Real receipt file storage and OCR; the current receipt review flow is mocked.
- Automated email/push/in-app budget notification delivery.
- Implicit currency conversion or non-EUR financial aggregation.
- App-level two-factor authentication.
- Any claim of regulated banking, investment, tax, or legal advice.

## Current Quality Gate

The complete gate is maintained in `qa-checklist.md`. It covers Prisma
format/validation/generation/migration, API unit and end-to-end tests, frontend
lint/style/type/test/build checks, dependency audits, container builds, health
smoke tests, two-user isolation, provider flows, backup restore, and
final-hostname security verification.

The original sequencing rule remains useful: financial-provider features build
on the privacy-aware user-owned backend, and repository implementation must not
be presented as proof that external production infrastructure is configured.
