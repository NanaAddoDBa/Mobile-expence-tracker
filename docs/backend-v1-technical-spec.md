# Backend V1 Technical Specification

Backend V1 turns the frontend prototype into a real application for user-owned manual data. It should not start with Open Banking. The first milestone is:

```text
A user can sign up, log in, add expenses, create budgets, create goals, and see their own data persisted in PostgreSQL.
```

## Goals

Backend V1 should provide:

- Real authentication.
- User-owned persistence.
- Expenses API.
- Budgets API.
- Goals API.
- Settings API.
- Data export endpoint.
- Account data deletion endpoint.
- Audit logs for sensitive actions.
- A frontend API client boundary that can replace mock repositories gradually.

## Out of Scope

Backend V1 should not include:

- Real Open Banking connections.
- Real OCR providers.
- Payment initiation.
- Money movement.
- Investment advice.
- Tax advice.
- Legal advice.
- Provider token storage before token encryption is designed.

## Recommended Stack

```text
Backend: NestJS or Fastify with TypeScript
Database: PostgreSQL
ORM: Prisma
Validation: Zod or class-validator
Auth: hosted auth provider or secure-cookie custom auth
Tests: backend unit and integration tests
```

Keep the stack boring and replaceable. The backend should expose clear HTTP APIs and keep external integrations behind adapters.

## Authentication Strategy

Required auth behavior:

- Register.
- Log in.
- Log out.
- Get current user.
- Protect all user-owned routes.
- Scope every data query by authenticated `userId`.

Preferred session model:

- HTTP-only secure cookies for custom auth, or a trusted hosted auth provider.
- No session tokens in browser local storage.
- CSRF protection if using cookie-based auth.

## API Endpoints

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### Expenses

```text
GET    /expenses
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
```

Expense create payload:

```ts
type CreateExpenseRequest = {
  merchant: string;
  description?: string;
  amountMinor: number;
  currency: "EUR";
  date: string;
  category: string;
  paymentMethod: string;
  entrySource: "manual" | "receipt_scan" | "connected_account" | "recurring_forecast";
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  receiptId?: string;
  connectedAccountId?: string;
  externalTransactionId?: string;
  importBatchId?: string;
};
```

Backend V1 should accept manual expenses first. Other entry sources may be represented in the model, but real receipt and account imports can remain disabled until later milestones.

### Budgets

```text
GET    /budgets
POST   /budgets
PATCH  /budgets/:id
DELETE /budgets/:id
```

Budget create payload:

```ts
type CreateBudgetRequest = {
  name: string;
  category: string;
  limitAmountMinor: number;
  currency: "EUR";
  monthKey: string;
};
```

### Goals

```text
GET    /goals
POST   /goals
PATCH  /goals/:id
DELETE /goals/:id
```

Goal create payload:

```ts
type CreateGoalRequest = {
  name: string;
  targetAmountMinor: number;
  savedAmountMinor?: number;
  currency: "EUR";
  targetDate?: string;
};
```

### Settings

```text
GET   /settings
PATCH /settings
```

Settings should include harmless preferences such as theme, accessibility, and notification preferences. Sensitive secrets do not belong in settings payloads.

### User Data

```text
GET    /export
DELETE /account-data
GET    /audit-logs
```

Export must not include secrets, provider tokens, password hashes, or internal encryption metadata.

Account data deletion must remove user-owned application data and invalidate sessions as appropriate.

## Database Tables

Backend V1 minimum tables:

```text
users
user_settings
expenses
budgets
goals
audit_logs
```

Near-future tables:

```text
receipts
receipt_extractions
connected_accounts
bank_connection_consents
external_accounts
external_transactions
account_import_batches
account_sync_runs
notifications
notification_preferences
```

## User Ownership Requirements

Every user-owned table needs:

```text
userId
createdAt
updatedAt
```

Every route must use the authenticated user from the session. The backend must not trust a `userId` supplied by the frontend for ownership.

## Validation Rules

Validate on the server:

- Required strings are present and not only whitespace.
- Amounts are positive where required.
- Currency codes are supported.
- Dates use accepted formats.
- Month keys use `YYYY-MM`.
- Enum values are supported.
- User-owned resource IDs belong to the authenticated user.

## Audit Log Behavior

Record audit events for:

- Register.
- Login.
- Logout.
- Data export.
- Account data deletion.
- Expense delete.
- Budget delete.
- Goal delete.

Audit logs should store the event type, user ID, timestamp, and safe metadata. They should not store secrets or raw tokens.

## Frontend API Client Boundary

The frontend should move toward this boundary:

```text
Provider
-> feature hook
-> feature service
-> API client interface
-> mock API client now
-> backend API later
```

Recommended frontend API files:

```text
src/services/api/authApi.ts
src/services/api/expenseApi.ts
src/services/api/budgetApi.ts
src/services/api/goalApi.ts
src/services/api/accountApi.ts
src/services/api/receiptApi.ts
src/services/api/settingsApi.ts
src/services/api/notificationApi.ts
```

For now, these API clients can call existing mock repositories. Later, the same API interface can call backend endpoints.

## Mock-to-Real Adapter Boundary

Mock providers should remain replaceable:

```text
mock repository
-> API client interface
-> backend API implementation
```

Do not let UI components call local storage, raw mock account providers, or raw OCR functions directly.

## Backend V1 Acceptance Criteria

Backend V1 is complete when:

- A user can register.
- A user can log in.
- A user can log out.
- `/auth/me` returns the authenticated user.
- A user can create, list, update, and delete their own expenses.
- A user can create, list, update, and delete their own budgets.
- A user can create, list, update, and delete their own goals.
- A user cannot read or modify another user's data.
- User settings persist in PostgreSQL.
- Data export returns the user's supported data.
- Account data deletion removes supported user-owned data.
- Audit logs are written for sensitive actions.
- Backend tests cover ownership, validation, and core workflows.
- The frontend can be connected through API client interfaces without changing UI components.
