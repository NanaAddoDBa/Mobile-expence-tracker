# Expense Tracker API

This folder contains the NestJS Backend V1 scaffold, its PostgreSQL-ready Prisma data model, and the initial cookie-session authentication foundation.

The current backend exposes app, health, and authentication endpoints. Expense, budget, goal, settings, and other business CRUD APIs are not implemented yet.

## Setup

Install backend dependencies from the project root:

```bash
npm --prefix server install
```

Create a local environment file:

```powershell
Copy-Item server/.env.example server/.env
```

Update `DATABASE_URL` in `server/.env` for your PostgreSQL instance:

```text
postgresql://postgres:postgres@localhost:5432/expense_tracker?schema=public
```

Do not commit `server/.env`.

Backend and Prisma scripts load `server/.env` when it exists. Schema-only Prisma commands fall back to the non-secret development URL in `.env.example`, so formatting, validation, and client generation do not require a running database.

## Prisma Commands

Format and validate the schema:

```bash
npm run db:format
npm run db:validate
```

Generate Prisma Client:

```bash
npm run db:generate
```

When a PostgreSQL database is available and `DATABASE_URL` is configured, create or apply a development migration:

```bash
npm run db:migrate:dev
```

Open Prisma Studio when a database is available:

```bash
npm run db:studio
```

Migrations are not run automatically.

## Data Model

The schema includes these Backend V1 models:

- `User` and `UserSettings`
- `Session`
- `Expense`
- `Budget`
- `Goal`
- `Notification`
- `AuditLog`
- `Receipt` and `ReceiptExtraction`
- `ConnectedAccount` and `ExternalAccount`
- `ExternalTransaction` and `ImportBatch`
- `ConsentRecord`
- `AccountSyncRun`

Notification preferences remain in `UserSettings` for V1 instead of being duplicated in a separate `NotificationPreference` model.

Money is stored as integer minor units with an explicit `CurrencyCode`. For example, EUR 12.50 is stored as `amountMinor = 1250` and `currency = EUR`.

The future-ready receipt, connected-account, consent, import, and sync models are data placeholders only. There are no real OCR, Open Banking, payment, or provider integrations.

## Runtime Behavior

`PrismaService` only connects during Nest startup when `DATABASE_URL` is present in the process environment. Without it, the API and `/api/health` endpoint continue to run without a live database. Authentication endpoints require a configured PostgreSQL database with the auth schema applied.

## Authentication

Backend V1 provides:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Registration and login return a safe user response and set an opaque session token in the `exp_tracker_session` cookie. The cookie is `HttpOnly`, uses `SameSite=Lax`, and is secure in production when `COOKIE_SECURE=true` or `NODE_ENV=production`.

Only a SHA-256 hash of the random session token is stored in PostgreSQL. The raw token is never returned in JSON and must never be stored in frontend `localStorage`.

Session lifetime is controlled by `SESSION_TTL_DAYS`, which defaults to seven days. Passwords use bcrypt hashing, with `BCRYPT_ROUNDS` defaulting to 12. Logout revokes the matching server-side session and clears the browser cookie. `/api/auth/me` is protected by `AuthGuard`.

This phase does not include OAuth, social sign-in, refresh tokens, password reset, email verification workflows, or frontend auth integration.

## Backend Conventions

The API bootstrap uses a global `ValidationPipe` that transforms explicitly decorated values, rejects unknown DTO fields, and strips no fields silently. Shared DTOs provide pagination, date-range, ID, money, and stable enum validation.

Future endpoints should use these response shapes:

```json
{
  "data": {},
  "meta": {}
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [],
    "requestId": "optional-request-id",
    "timestamp": "2026-06-09T00:00:00.000Z"
  }
}
```

Pagination defaults to page `1` with `20` items per page and allows at most `100` items per page. The shared HTTP exception filter handles expected Nest `HttpException` values without exposing stack traces. Unexpected errors remain with Nest's default error handling for now.

`RequestUser` defines the authenticated request shape. `AuthGuard` currently protects `/api/auth/me`; business routes can adopt it when their modules are implemented.

Start the backend:

```bash
npm run dev:api
```

Run backend checks:

```bash
npm run build:api
npm run test:api
npm run test:e2e:api
```
