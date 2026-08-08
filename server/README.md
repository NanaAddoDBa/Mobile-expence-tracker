# Expense Tracker API

This folder contains the NestJS Backend V1 scaffold, its PostgreSQL-ready Prisma data model, cookie-session authentication, authenticated manual expense, budget, and goal tracking, and read-only GoCardless Bank Account Data transaction import.

The current backend exposes app, health, authentication, expense, budget, goal, and connected-account import endpoints. Settings and other business CRUD APIs are not implemented yet.

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

For real transaction import, also configure GoCardless Bank Account Data credentials in `server/.env`:

```text
PUBLIC_API_URL=http://localhost:4000
GOCARDLESS_SECRET_ID=your-secret-id
GOCARDLESS_SECRET_KEY=your-secret-key
GOCARDLESS_DEFAULT_COUNTRY=DE
GOCARDLESS_DEFAULT_INSTITUTION_ID=SANDBOXFINANCE_SFIN0000
```

`PUBLIC_API_URL` must be reachable by the browser after the bank consent flow so GoCardless can redirect back to `/api/connected-accounts/link/callback`.

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

Receipt models remain placeholders only. Connected-account, consent, import, and sync models support the read-only GoCardless transaction import foundation. There is no real OCR, payment initiation, or money movement.

## Runtime Behavior

`PrismaService` only connects during Nest startup when `DATABASE_URL` is present in the process environment. Without it, the API and `/api/health` endpoint continue to run without a live database. Authentication, expense, budget, goal, and transaction import endpoints require a configured PostgreSQL database with the Backend V1 schema applied.

## Authentication

Backend V1 provides:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Registration and login return a safe user response and set an opaque session token in the `exp_tracker_session` cookie. The cookie is `HttpOnly`, uses `SameSite=Lax`, and is secure in production when `COOKIE_SECURE=true` or `NODE_ENV=production`.

Only a SHA-256 hash of the random session token is stored in PostgreSQL. The raw token is never returned in JSON and must never be stored in frontend `localStorage`.

Session lifetime is controlled by `SESSION_TTL_DAYS`, which defaults to seven days. Passwords use bcrypt hashing, with `BCRYPT_ROUNDS` defaulting to 12. Logout revokes the matching server-side session and clears the browser cookie. `/api/auth/me` is protected by `AuthGuard`.

This phase does not include OAuth, social sign-in, refresh tokens, password reset, or email verification workflows.

## Expenses

Backend V1 provides authenticated manual expense tracking:

- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/:id`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`

All expense routes use the session `AuthGuard`; clients never provide `userId`. List, read, update, and delete operations are scoped to the authenticated user, so another user receives `404` for expenses they do not own.

Expense money is stored as integer minor units in `amountMinor`. V1 accepts only `EUR`. API category, payment method, entry source, and recurring frequency values use lowercase wire values and are mapped to Prisma enums internally.

## Budgets

Backend V1 provides authenticated budget tracking:

- `GET /api/budgets`
- `POST /api/budgets`
- `GET /api/budgets/:id`
- `PATCH /api/budgets/:id`
- `DELETE /api/budgets/:id`

Budgets are scoped to the authenticated user. Budget amounts are stored as integer minor units in `limitAmountMinor`, V1 accepts only `EUR`, and `monthKey` uses `YYYY-MM`. A user can have only one budget for the same category and month.

## Goals

Backend V1 provides authenticated savings goal tracking:

- `GET /api/goals`
- `POST /api/goals`
- `GET /api/goals/:id`
- `PATCH /api/goals/:id`
- `DELETE /api/goals/:id`

Goals are scoped to the authenticated user. Goal amounts are stored as integer minor units, V1 accepts only `EUR`, and the backend prevents current savings from exceeding the target amount. Goal status is automatically set to `completed` when current savings reaches the target.

## Connected Accounts and Transaction Import

Backend V1 provides read-only transaction import through GoCardless Bank Account Data:

- `GET /api/connected-accounts`
- `GET /api/connected-accounts/institutions?country=DE`
- `POST /api/connected-accounts/link/start`
- `GET /api/connected-accounts/link/callback`
- `POST /api/connected-accounts/:id/import`
- `DELETE /api/connected-accounts/:id`

The frontend starts the connection and then redirects the user to the provider consent link. The backend handles provider token exchange, requisition creation, callback completion, external account storage, transaction fetching, deduplication, import batches, and expense creation.

Imported bank transactions are read-only. The app never collects bank passwords and cannot initiate payments. Provider transaction data is normalized into `ExternalTransaction` rows and positive app `Expense` rows with `entrySource = CONNECTED_ACCOUNT`.

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

`RequestUser` defines the authenticated request shape. `AuthGuard` protects `/api/auth/me`, expenses, budgets, goals, and connected-account import routes.

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
