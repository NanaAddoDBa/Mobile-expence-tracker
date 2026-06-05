# Backend API Contract

This document defines the initial Backend V1 HTTP API. All user-owned routes require authentication and must scope reads/writes by the authenticated `userId`.

## Shared Rules

- Auth is required unless the endpoint is explicitly part of register/login.
- Do not accept `userId` from client request bodies for ownership.
- Every user-owned query must use authenticated `userId`.
- Request validation happens server-side.
- Responses must not include password hashes, session secrets, provider tokens, or internal encryption metadata.
- Money values use integer minor units, such as `amountMinor: 1250` for EUR 12.50.
- Backend V1 supports EUR as the default currency.

## Shared Domain Values

```ts
type EntrySource = "manual" | "receipt_scan" | "connected_account" | "recurring_forecast";
type PaymentMethod = "cash" | "debit_card" | "credit_card" | "digital_wallet" | "bank_transfer";
type AccountType = "checking" | "savings" | "credit_card" | "digital_wallet";
```

Backend V1 should create manual expenses first, while keeping `entrySource`, `paymentMethod`, `sourceAccountId`, `receiptId`, `importBatchId`, and `externalTransactionId` available in the model for future receipt/import flows.

## Error Shape

Recommended error shape:

```ts
type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};
```

Likely shared errors:

- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `422 VALIDATION_ERROR`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`

## Auth

### POST /auth/register

Purpose: create a user account and start a session.

Auth: not required.

Request:

```ts
type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};
```

Response:

```ts
type RegisterResponse = {
  user: UserResponse;
};
```

Validation notes:

- Name is required.
- Email must be valid and unique.
- Password must meet the chosen auth policy.

Ownership rule: creates a new user-owned scope.

Likely errors: `409 CONFLICT`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

### POST /auth/login

Purpose: authenticate a user and start a session.

Auth: not required.

Request:

```ts
type LoginRequest = {
  email: string;
  password: string;
};
```

Response:

```ts
type LoginResponse = {
  user: UserResponse;
};
```

Validation notes:

- Email and password are required.
- Use a generic failure message for invalid credentials.

Ownership rule: session identifies one authenticated user.

Likely errors: `401 UNAUTHORIZED`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

### POST /auth/logout

Purpose: end the current session.

Auth: required.

Request: none.

Response:

```ts
type LogoutResponse = {
  success: true;
};
```

Validation notes: none.

Ownership rule: only the current user's session is ended.

Likely errors: `401 UNAUTHORIZED`.

### GET /auth/me

Purpose: return the authenticated user.

Auth: required.

Request: none.

Response:

```ts
type MeResponse = {
  user: UserResponse;
};
```

Validation notes: none.

Ownership rule: returns only the current user.

Likely errors: `401 UNAUTHORIZED`.

## Users/Profile

### GET /me

Purpose: return the current user's profile.

Auth: required.

Request: none.

Response:

```ts
type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};
```

Validation notes: none.

Ownership rule: returns only authenticated user's profile.

Likely errors: `401 UNAUTHORIZED`.

### PATCH /me

Purpose: update profile fields.

Auth: required.

Request:

```ts
type UpdateProfileRequest = {
  name?: string;
  email?: string;
};
```

Response:

```ts
type UpdateProfileResponse = {
  user: UserResponse;
};
```

Validation notes:

- Name cannot be empty when provided.
- Email must be valid and unique when provided.

Ownership rule: updates only authenticated user's profile.

Likely errors: `401 UNAUTHORIZED`, `409 CONFLICT`, `422 VALIDATION_ERROR`.

## Settings

### GET /settings

Purpose: return current user settings.

Auth: required.

Request: none.

Response:

```ts
type SettingsResponse = {
  settings: {
    theme: "light" | "dark" | "system";
    currency: "EUR";
    language: string;
    accessibility: {
      largerText: boolean;
      reduceMotion: boolean;
      highContrast: boolean;
      comfortableLayout: boolean;
    };
    notifications: {
      enableAlerts: boolean;
      budgetThreshold: number;
      recurringReminders: boolean;
      weeklySummaries: boolean;
    };
  };
};
```

Validation notes: none.

Ownership rule: returns only authenticated user's settings.

Likely errors: `401 UNAUTHORIZED`.

### PATCH /settings

Purpose: update current user settings.

Auth: required.

Request:

```ts
type UpdateSettingsRequest = Partial<SettingsResponse["settings"]>;
```

Response:

```ts
type UpdateSettingsResponse = SettingsResponse;
```

Validation notes:

- Theme must be supported.
- Currency must be `EUR` in V1.
- Budget threshold should be a practical percentage, such as 1-100.

Ownership rule: updates only authenticated user's settings.

Likely errors: `401 UNAUTHORIZED`, `422 VALIDATION_ERROR`.

## Expenses

### GET /expenses

Purpose: list current user's expenses.

Auth: required.

Request: optional query params for paging/filtering later.

Response:

```ts
type ExpenseResponse = {
  id: string;
  merchant: string;
  description: string;
  amountMinor: number;
  currency: "EUR";
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  entrySource: EntrySource;
  notes?: string;
  receiptId?: string;
  sourceAccountId?: string;
  importBatchId?: string;
  externalTransactionId?: string;
  recurringTemplateId?: string;
  createdAt: string;
  updatedAt: string;
};

type ListExpensesResponse = {
  expenses: ExpenseResponse[];
};
```

Validation notes: validate query params when added.

Ownership rule: list only rows where `expense.userId` matches authenticated user.

Likely errors: `401 UNAUTHORIZED`.

### POST /expenses

Purpose: create an expense.

Auth: required.

Request:

```ts
type CreateExpenseRequest = {
  merchant: string;
  description?: string;
  amountMinor: number;
  currency: "EUR";
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  entrySource?: EntrySource;
  notes?: string;
  receiptId?: string;
  sourceAccountId?: string;
  importBatchId?: string;
  externalTransactionId?: string;
  recurringTemplateId?: string;
};
```

Response:

```ts
type CreateExpenseResponse = {
  expense: ExpenseResponse;
};
```

Validation notes:

- Merchant is required.
- `amountMinor` must be positive for normal expenses.
- Currency must be `EUR` in V1.
- Date must be valid.
- `entrySource` defaults to `manual` if omitted.
- `receiptId`, `sourceAccountId`, `importBatchId`, and `externalTransactionId` are reserved for later receipt/import flows.

Ownership rule: server assigns authenticated `userId`.

Likely errors: `401 UNAUTHORIZED`, `422 VALIDATION_ERROR`.

### GET /expenses/:id

Purpose: fetch one expense.

Auth: required.

Request: `id` route param.

Response:

```ts
type GetExpenseResponse = {
  expense: ExpenseResponse;
};
```

Validation notes: ID must be a valid identifier.

Ownership rule: fetch only if expense belongs to authenticated user.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

### PATCH /expenses/:id

Purpose: update one expense.

Auth: required.

Request:

```ts
type UpdateExpenseRequest = Partial<CreateExpenseRequest>;
```

Response:

```ts
type UpdateExpenseResponse = {
  expense: ExpenseResponse;
};
```

Validation notes: validate only provided fields.

Ownership rule: update only if expense belongs to authenticated user.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

### DELETE /expenses/:id

Purpose: delete one expense.

Auth: required.

Request: `id` route param.

Response:

```ts
type DeleteExpenseResponse = {
  success: true;
};
```

Validation notes: ID must be valid.

Ownership rule: delete only if expense belongs to authenticated user.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

## Budgets

### GET /budgets

Purpose: list current user's budgets.

Auth: required.

Request: optional query params later.

Response:

```ts
type BudgetResponse = {
  id: string;
  category: string;
  limitAmountMinor: number;
  currency: "EUR";
  monthKey: string;
  createdAt: string;
  updatedAt: string;
};

type ListBudgetsResponse = {
  budgets: BudgetResponse[];
};
```

Validation notes: validate query params when added.

Ownership rule: list only authenticated user's budgets.

Likely errors: `401 UNAUTHORIZED`.

### POST /budgets

Purpose: create a budget.

Auth: required.

Request:

```ts
type CreateBudgetRequest = {
  category: string;
  limitAmountMinor: number;
  currency: "EUR";
  monthKey: string;
};
```

Response:

```ts
type CreateBudgetResponse = {
  budget: BudgetResponse;
};
```

Validation notes:

- Category is required.
- Limit must be positive.
- Currency must be `EUR`.
- Month key must be `YYYY-MM`.
- A user should not have duplicate budgets for the same category and month.

Ownership rule: server assigns authenticated `userId`.

Likely errors: `401 UNAUTHORIZED`, `409 CONFLICT`, `422 VALIDATION_ERROR`.

### GET /budgets/:id

Purpose: fetch one budget.

Auth: required.

Request: `id` route param.

Response:

```ts
type GetBudgetResponse = {
  budget: BudgetResponse;
};
```

Validation notes: ID must be valid.

Ownership rule: fetch only authenticated user's budget.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

### PATCH /budgets/:id

Purpose: update one budget.

Auth: required.

Request:

```ts
type UpdateBudgetRequest = Partial<CreateBudgetRequest>;
```

Response:

```ts
type UpdateBudgetResponse = {
  budget: BudgetResponse;
};
```

Validation notes: validate category, amount, currency, and month key when provided.

Ownership rule: update only authenticated user's budget.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `409 CONFLICT`, `422 VALIDATION_ERROR`.

### DELETE /budgets/:id

Purpose: delete one budget.

Auth: required.

Request: `id` route param.

Response:

```ts
type DeleteBudgetResponse = {
  success: true;
};
```

Validation notes: ID must be valid.

Ownership rule: delete only authenticated user's budget.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

## Goals

### GET /goals

Purpose: list current user's savings goals.

Auth: required.

Request: optional query params later.

Response:

```ts
type GoalResponse = {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  currency: "EUR";
  targetDate: string;
  createdAt: string;
  updatedAt: string;
};

type ListGoalsResponse = {
  goals: GoalResponse[];
};
```

Validation notes: validate query params when added.

Ownership rule: list only authenticated user's goals.

Likely errors: `401 UNAUTHORIZED`.

### POST /goals

Purpose: create a savings goal.

Auth: required.

Request:

```ts
type CreateGoalRequest = {
  name: string;
  targetAmountMinor: number;
  currentAmountMinor?: number;
  currency: "EUR";
  targetDate: string;
};
```

Response:

```ts
type CreateGoalResponse = {
  goal: GoalResponse;
};
```

Validation notes:

- Name is required.
- Target amount must be positive.
- Current amount defaults to 0 and cannot exceed target amount unless product rules change.
- Currency must be `EUR`.
- Target date must be valid.

Ownership rule: server assigns authenticated `userId`.

Likely errors: `401 UNAUTHORIZED`, `422 VALIDATION_ERROR`.

### GET /goals/:id

Purpose: fetch one goal.

Auth: required.

Request: `id` route param.

Response:

```ts
type GetGoalResponse = {
  goal: GoalResponse;
};
```

Validation notes: ID must be valid.

Ownership rule: fetch only authenticated user's goal.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

### PATCH /goals/:id

Purpose: update one savings goal.

Auth: required.

Request:

```ts
type UpdateGoalRequest = Partial<CreateGoalRequest>;
```

Response:

```ts
type UpdateGoalResponse = {
  goal: GoalResponse;
};
```

Validation notes: validate only provided fields.

Ownership rule: update only authenticated user's goal.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

### DELETE /goals/:id

Purpose: delete one goal.

Auth: required.

Request: `id` route param.

Response:

```ts
type DeleteGoalResponse = {
  success: true;
};
```

Validation notes: ID must be valid.

Ownership rule: delete only authenticated user's goal.

Likely errors: `401 UNAUTHORIZED`, `404 NOT_FOUND`.

## Data Export and Delete

### GET /data-export

Purpose: export supported user data.

Auth: required.

Request: none.

Response:

```ts
type DataExportResponse = {
  exportedAt: string;
  user: UserResponse;
  settings: SettingsResponse["settings"];
  expenses: ExpenseResponse[];
  budgets: BudgetResponse[];
  goals: GoalResponse[];
  auditLogs?: AuditLogResponse[];
};
```

Validation notes: none.

Ownership rule: export only authenticated user's data.

Likely errors: `401 UNAUTHORIZED`, `429 RATE_LIMITED`.

### DELETE /account-data

Purpose: delete supported user-owned application data.

Auth: required.

Request:

```ts
type DeleteAccountDataRequest = {
  confirm: true;
};
```

Response:

```ts
type DeleteAccountDataResponse = {
  success: true;
  deletedAt: string;
};
```

Validation notes: require explicit confirmation payload.

Ownership rule: delete only authenticated user's data.

Likely errors: `401 UNAUTHORIZED`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

## Audit

### GET /audit-logs

Purpose: return current user's audit log entries.

Auth: required.

Request: optional paging query params later.

Response:

```ts
type AuditLogResponse = {
  id: string;
  eventType: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

type ListAuditLogsResponse = {
  auditLogs: AuditLogResponse[];
};
```

Validation notes: validate paging query params when added.

Ownership rule: list only audit logs for authenticated user.

Likely errors: `401 UNAUTHORIZED`.
