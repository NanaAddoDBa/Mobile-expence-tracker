# Backend Data Model

The API persists data in PostgreSQL through Prisma. The current schema is in
`server/prisma/schema.prisma`; this document records its ownership and money
invariants rather than duplicating every column.

## Global Invariants

- Every user-owned financial row carries `userId` and every service query is
  scoped by the authenticated user.
- Client payloads never choose an owning `userId`.
- Money is stored as integer minor units. The active ledger, budgets, goals,
  cash-flow totals, and bank import path are EUR-only until an explicit FX
  design is implemented.
- User deletion cascades through owned rows. Provider requisitions are revoked
  before the `User` row is deleted.
- Provider transaction payloads remain server-side; browser clients receive
  normalized account and import summaries.
- Payment initiation, card control, and bank credential storage are outside the
  product boundary.

## Identity And Privacy

### `User`

The ownership root. It stores normalized email, optional display name, optional
password hash, email-verification state, account status, and login timestamps.
Password hashes and provider credentials are never returned by profile or
export responses.

### `AuthIdentity`

Maps a user to a stable Google subject. The provider subject is unique and an
identity cannot be silently linked to a password account solely by matching an
email address.

### `Session`

Stores a hash of the opaque session token, optional user-agent/IP metadata,
expiry, and revocation time. The raw session token exists only in the secure
HTTP-only cookie and is not persisted.

### Recovery Tokens

`EmailVerificationToken` and `PasswordResetToken` store only token hashes,
expiry, use state, and ownership. Tokens are single-use. Expired and old used
records are removed by the daily retention job.

### `UserSettings`

Stores base currency, theme, locale, budget/summary preferences, and
accessibility preferences. These are server-backed per-user settings.

### `AuditLog`

Records sensitive account actions with optional entity, request IP, user-agent,
and metadata. It must never contain passwords, session cookies, CSRF values,
recovery tokens, provider secrets, or full bank payloads. The configured
retention defaults to 365 days.

## Financial Ledger

### `Expense`

Stores outflows with merchant, optional description, positive `amountMinor`,
EUR currency, date, category, payment method, entry source, notes, recurrence
metadata, and optional receipt/import/account links.

### `Income`

Stores inflows with source, optional description, positive `amountMinor`, EUR
currency, date, category, payment method, entry source, notes, recurrence
metadata, and optional import/account links.

Imported ledger rows identify their source transaction through
`externalTransactionId`. The `(userId, externalTransactionId)` constraint stops
one user's imported transaction from being materialized twice.

Transfers are persisted for ledger completeness but excluded from operating
income, spending, net cash flow, and savings-rate calculations so movement
between a user's own accounts does not inflate totals.

### `Budget`

Stores a category limit, EUR currency, period (`DAILY`, `WEEKLY`, `MONTHLY`, or
`ANNUAL`), and normalized `periodKey`. The composite uniqueness constraint
allows one budget per user/category/period/window. Progress is calculated from
the user's EUR expenses in that exact period.

### `Goal`

Stores a named EUR target, current saved amount, optional target date, and
status. Goal progress is a planning record; changing it does not move money.

### `Notification`

The schema can persist in-app notifications, but automated email, push, and
in-app notification delivery are not implemented. User preference fields do
not imply that a delivery worker exists.

## Read-Only Bank Import

### `ConnectedAccount`

Represents one provider requisition and its lifecycle. It stores the
institution/agreement references, consent expiry, connection state, last/next
sync timestamps, last error, and an expiring sync lease. Provider application
credentials remain in server environment secrets.

### `ExternalAccount`

Maps a provider account into the internal connection. It stores the provider
account ID, display metadata, selection state, EUR current/available balance,
and the time of the balance snapshot.

### `ExternalTransaction`

Stores the normalized source transaction with direction, booking status,
amount, date, categories, provider metadata, and a stable deduplication hash.
`PENDING` transactions are retained as source records but do not affect the
ledger. A later `BOOKED` transaction promotes or replaces the pending source
and creates one income or expense row.

### `ImportBatch`

Summarizes one import attempt: status, imported, duplicate, pending, and failed
counts plus timestamps and a user-facing message.

### `AccountSyncRun`

Records operational sync history independently from user-facing batches,
including trigger outcome, request count, counts, and sanitized error details.

### `ConsentRecord`

Records consent lifecycle state (`STARTED`, `GRANTED`, `EXPIRED`, `REVOKED`, or
`ERROR`) and timestamps. Reconnect and disconnect create auditable lifecycle
changes; disconnect and account deletion revoke the provider requisition.

## Receipt Placeholders

`Receipt` and `ReceiptExtraction` exist as schema foundations. The current UI
uses a mock review flow; the backend does not yet provide secure object storage,
upload validation, malware scanning, or real OCR. These records must not be
described as a production receipt-processing capability.

## Deletion And Retention

- `DELETE /api/profile` requires the literal confirmation `DELETE`.
- Bank provider access is revoked before local account deletion.
- Deleting the user cascades through user-owned primary records.
- Expired/revoked sessions default to 30-day cleanup, used auth tokens to 7
  days, and audit logs to 365 days.
- Managed database backups may retain deleted rows until the configured backup
  window expires; the production privacy notice must disclose that window.
