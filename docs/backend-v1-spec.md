# Backend V1 Specification

Backend V1 turns Expense Tracker & Budget Manager from a mock frontend into a backend-backed application for user-owned manual data. It should establish authentication, PostgreSQL persistence, privacy-aware ownership rules, export/delete behavior, and audit logging before any real Open Banking or OCR work begins.

## Product Boundary

Expense Tracker & Budget Manager helps users track expenses, create budgets, track savings goals, manage settings, and understand spending patterns.

Backend V1 must not include:

- Real Open Banking.
- Real bank connections.
- Real card or wallet connections.
- Real OCR.
- Payments.
- Money movement.
- Investment advice.
- Tax advice.
- Legal advice.
- Banking advice.

Backend V1 implements manual/local app data persistence first. Open Banking, real OCR, receipt file storage, and notification delivery are later phases.

## Backend V1 Goal

The Backend V1 goal is:

```text
A user can sign up, log in, add expenses, create budgets, create goals, update settings, export their data, delete their data, and see their own data persisted in PostgreSQL.
```

## Included Scope

Backend V1 includes:

- Register, login, logout, and current-user session behavior.
- User profile persistence.
- User settings persistence.
- Expense CRUD.
- Budget CRUD.
- Goal CRUD.
- Data export endpoint.
- Account data deletion endpoint.
- Audit logs for sensitive actions.
- Server-side validation.
- Server-side authorization.
- User ownership checks on every user-owned resource.
- API contracts that align with the frontend API client boundary in `src/services/api/`.

## Excluded Scope

Backend V1 excludes:

- Open Banking provider integration.
- Real account connection flows.
- Real transaction import.
- Provider token storage.
- Receipt image upload and OCR processing, except placeholder models/routes where useful.
- Real notification delivery.
- Payment initiation or payment control.
- Advice or recommendations that create regulated financial, tax, legal, investment, or banking obligations.

## Recommended Backend Stack

- NestJS or Fastify with TypeScript.
- PostgreSQL.
- Prisma.
- Secure HTTP-only cookie auth or a trusted auth provider.
- Zod, class-validator, or equivalent server-side validation.
- Vitest or Jest for backend unit tests.
- Supertest or equivalent for API integration tests.

The backend should expose clear HTTP APIs and keep external providers behind replaceable adapters.

## Module Breakdown

Backend V1 modules:

- `auth`: register, login, logout, session/current user.
- `users`: profile data and account ownership.
- `settings`: user preferences, notification preferences, accessibility preferences.
- `expenses`: expense CRUD and source metadata.
- `budgets`: budget CRUD and budget month/category rules.
- `goals`: savings goal CRUD and manual contribution state.
- `receipts`: placeholder only for future receipt records and OCR extraction links.
- `connected-accounts`: placeholder only for future read-only account metadata.
- `notifications`: placeholder only for future in-app notification persistence.
- `audit-logs`: security and privacy audit events.
- `export-delete`: user data export and account data deletion.

## Development Milestones

1. Create backend project and environment configuration.
2. Add PostgreSQL and Prisma.
3. Define Prisma schema for V1 tables.
4. Add authentication and session strategy.
5. Add user profile and settings endpoints.
6. Add expenses CRUD with ownership checks.
7. Add budgets CRUD with ownership checks.
8. Add goals CRUD with ownership checks.
9. Add data export and account-data deletion.
10. Add audit logging for sensitive actions.
11. Connect frontend API clients to the backend behind the existing `src/services/api/` boundary.
12. Add backend unit and integration tests.

## Frontend API Boundary Alignment

The frontend currently routes providers through API clients:

```text
Provider
-> API client interface
-> mock API implementation
-> existing mock repository
-> local storage
```

Backend V1 should replace the mock API implementations with HTTP-backed implementations without changing UI components.

Current frontend domain values such as `amount` are decimal values in mock state. Backend V1 should store money as integer minor units. The future HTTP client can map frontend form values to backend `amountMinor` payloads until the frontend domain model is migrated.

## Quality Gates

Before Backend V1 is considered ready:

- Backend lint passes.
- Backend typecheck passes.
- Backend unit tests pass.
- Backend API integration tests pass.
- Database migrations run cleanly.
- Ownership tests prove users cannot access each other's data.
- Validation tests cover invalid payloads.
- Export/delete tests pass.
- Frontend quality gates still pass.

Frontend gates:

```text
npm run lint
npm run lint:styles
npm run typecheck
npm run test
npm run build
```

## Future Phases After Backend V1

After Backend V1:

1. Receipt backend with upload targets, object storage, receipt records, and a mock backend OCR adapter.
2. Open Banking sandbox for read-only account information and transaction import.
3. Import deduplication, import batches, sync history, and reconnect states.
4. Notification persistence and in-app notifications.
5. Sync worker, retry/backoff, provider error mapping, and rate-limit handling.
6. Production security, privacy, monitoring, backups, and deployment operations.

Do not start with Open Banking. Build the privacy-aware backend foundation first.
