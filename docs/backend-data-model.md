# Backend Data Model

Backend V1 uses PostgreSQL and Prisma. The model should preserve frontend domain concepts while introducing backend ownership, privacy, and money handling rules.

## Global Rules

- Every user-owned row must include `userId`.
- Every API query must be scoped by authenticated `userId`.
- Backend money values use integer minor units, not floating-point calculations.
- Store `currency` with every money field.
- Expenses keep `entrySource` separate from `paymentMethod`.
- Connected account metadata stays separate from manual expense data.
- Receipt metadata stays separate from manual expense data.
- Provider-specific fields stay in provider metadata and adapter layers.

## User

Purpose: account identity and ownership root.

Important fields:

- `id`
- `email`
- `name`
- `passwordHash` or external auth subject
- `createdAt`
- `updatedAt`

Relationships:

- Has one `UserSettings`.
- Has many `Expense`, `Budget`, `Goal`, and `AuditLog` rows.

Ownership model: `User.id` is the owner key for all user-owned records.

Privacy notes: do not expose password hashes or auth internals through API responses.

Future notes: may link to provider auth subject if using a trusted auth provider.

## UserSettings

Purpose: store user preferences.

Important fields:

- `id`
- `userId`
- `theme`
- `currency`
- `language`
- `accessibility`
- `notifications`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.

Ownership model: query by `userId`.

Privacy notes: settings should not contain secrets or provider tokens.

Future notes: notification preferences may move into a dedicated table when delivery exists.

## Expense

Purpose: user-owned spending record.

Suggested fields:

- `id`
- `userId`
- `merchant`
- `description`
- `amountMinor`
- `currency`
- `date`
- `category`
- `paymentMethod`
- `entrySource`
- `notes`
- `receiptId`
- `sourceAccountId`
- `importBatchId`
- `externalTransactionId`
- `recurringTemplateId`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- May link to a future `Receipt`.
- May link to a future `ConnectedAccount`, `ExternalTransaction`, and `ImportBatch`.

Ownership model: all reads and writes scope by `userId`.

Privacy notes: descriptions, merchant names, notes, and amounts are financial data.

Future notes: imported expenses should preserve connected-account metadata without changing the manual expense model.

## Budget

Purpose: user-created spending limit for a category and month.

Suggested fields:

- `id`
- `userId`
- `category`
- `limitAmountMinor`
- `currency`
- `monthKey`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.

Ownership model: all reads and writes scope by `userId`.

Privacy notes: budgets reveal spending priorities and should be treated as financial planning data.

Future notes: V1 budgets are EUR-only. Avoid mixing non-EUR expenses into budget totals until FX support exists.

## Goal

Purpose: user-created savings planning record.

Suggested fields:

- `id`
- `userId`
- `name`
- `targetAmountMinor`
- `currentAmountMinor`
- `currency`
- `targetDate`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.

Ownership model: all reads and writes scope by `userId`.

Privacy notes: goals may reveal personal financial plans.

Future notes: goals do not move money. Manual savings updates are planning records only.

## AuditLog

Purpose: record sensitive account and data actions.

Important fields:

- `id`
- `userId`
- `eventType`
- `occurredAt`
- `metadata`
- `ipHash` or safe request context if needed

Relationships:

- Belongs to `User`.

Ownership model: user-visible audit logs scope by `userId`; admin access should be tightly controlled if added later.

Privacy notes: metadata must not include secrets, raw tokens, passwords, or unnecessary financial detail.

Future notes: audit retention should be documented before production.

## Receipt Placeholder

Purpose: future receipt image and scan record.

Important fields:

- `id`
- `userId`
- `fileUrl`
- `fileName`
- `mimeType`
- `status`
- `linkedExpenseId`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- May link to `Expense`.

Ownership model: scope by `userId`.

Privacy notes: receipt images can contain personal and financial data.

Future notes: Backend V1 does not implement real receipt upload or real OCR.

## ConnectedAccount Placeholder

Purpose: future read-only account connection metadata.

Important fields:

- `id`
- `userId`
- `provider`
- `displayName`
- `accountType`
- `status`
- `consentId`
- `lastSyncAt`
- `needsReconnect`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- May have many `ExternalAccount`, `ExternalTransaction`, and `ImportBatch` rows.

Ownership model: scope by `userId`.

Privacy notes: do not store provider access tokens in this table unless encrypted token storage is explicitly designed.

Future notes: Backend V1 should only keep this as future-ready design.

## ExternalAccount Placeholder

Purpose: future provider account metadata mapped into the internal model.

Important fields:

- `id`
- `userId`
- `connectedAccountId`
- `providerAccountId`
- `displayName`
- `accountType`
- `currency`
- `maskedIdentifier`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.
- Belongs to `ConnectedAccount`.

Ownership model: scope by `userId`.

Privacy notes: store only necessary display metadata.

Future notes: real provider models stay behind provider adapters.

## ExternalTransaction Placeholder

Purpose: future imported provider transaction source record.

Important fields:

- `id`
- `userId`
- `connectedAccountId`
- `providerAccountId`
- `externalTransactionId`
- `importBatchId`
- `postedDate`
- `merchantName`
- `description`
- `amountMinor`
- `currency`
- `rawCategory`
- `normalizedCategory`
- `dedupeHash`
- `createdAt`

Relationships:

- Belongs to `User`.
- Belongs to `ConnectedAccount`.
- Belongs to `ImportBatch`.
- May link to `Expense`.

Ownership model: scope by `userId`.

Privacy notes: provider transaction data is financial data.

Future notes: deduplication should prefer provider transaction IDs when available.

## ImportBatch Placeholder

Purpose: future transaction import run summary.

Important fields:

- `id`
- `userId`
- `connectedAccountId`
- `status`
- `startedAt`
- `finishedAt`
- `newExpenseCount`
- `duplicateCount`
- `failedCount`
- `providerMessage`

Relationships:

- Belongs to `User`.
- Belongs to `ConnectedAccount`.
- Has many `ExternalTransaction` rows.

Ownership model: scope by `userId`.

Privacy notes: import summaries should avoid raw provider payloads.

Future notes: supports user-facing import result copy such as "Imported 12 new expenses."

## ConsentRecord Placeholder

Purpose: future Open Banking consent lifecycle record.

Important fields:

- `id`
- `userId`
- `provider`
- `status`
- `grantedAt`
- `expiresAt`
- `revokedAt`
- `needsReconnect`
- `metadata`

Relationships:

- Belongs to `User`.
- May link to `ConnectedAccount`.

Ownership model: scope by `userId`.

Privacy notes: provider tokens must be encrypted separately and never exposed to the frontend.

Future notes: consent expiry and reconnect states are required before real Open Banking.

## NotificationPreference Placeholder

Purpose: future notification preference persistence.

Important fields:

- `id`
- `userId`
- `budgetAlertsEnabled`
- `budgetThreshold`
- `recurringRemindersEnabled`
- `weeklySummariesEnabled`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to `User`.

Ownership model: scope by `userId`.

Privacy notes: preferences should control actual notification creation.

Future notes: can start inside `UserSettings` in Backend V1 and split later.

## Notification Placeholder

Purpose: future in-app notification record.

Important fields:

- `id`
- `userId`
- `type`
- `message`
- `isRead`
- `createdAt`

Relationships:

- Belongs to `User`.

Ownership model: scope by `userId`.

Privacy notes: notification messages should not expose sensitive details unnecessarily.

Future notes: delivery channels such as email and push come later.
