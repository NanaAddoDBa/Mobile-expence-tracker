# Privacy And Consent

This document describes implemented engineering behavior and the decisions a
production operator must complete. It is not legal advice.

## Data The App Collects

The API may store:

- Account identity: email, display name, verification state, auth provider,
  account status, and login timestamps.
- Security records: password hash for password accounts, hashed session and
  recovery tokens, session user-agent/IP metadata, and audit events.
- Preferences: locale, currency, theme, accessibility, and notification
  preferences.
- Financial records: user-entered/imported incomes and expenses, categories,
  dates, payment methods, notes, recurrence metadata, budgets, and goals.
- Read-only bank metadata when enabled: selected institution, provider
  requisition/agreement identifiers, consent state/expiry, external account
  metadata, EUR balance snapshots, normalized transactions, import batches, and
  sync history.
- Receipt placeholder metadata if future backend receipt routes use the existing
  schema. The current backend does not upload receipt files or run real OCR.

The profile export excludes password hashes, raw session tokens, recovery-token
hashes, CSRF values, SMTP credentials, database credentials, and GoCardless
application secrets.

## Data The App Does Not Collect

- Online-banking usernames, passwords, or PINs.
- Full card credentials or card security codes.
- Payment-initiation instructions.
- Google passwords or persisted Google ID/access tokens.
- Provider application secrets in browser storage.
- A production receipt image or OCR payload through the current API.

GoCardless handles institution authentication and consent. This API receives
read-only account/transaction data permitted by that consent.

## Ownership And Access

- The authenticated session determines `userId`; clients cannot submit an
  ownership ID.
- Financial and provider queries are scoped by that authenticated user.
- Connected-account routes additionally require a verified email.
- A user cannot retrieve, change, import, reconnect, or delete another user's
  resource by guessing its ID.
- Operators should grant production database and secret access only to people
  who require it and retain access-review evidence.

## Consent Lifecycle

The app records provider consent as started, granted, expired, revoked, or
error. It shows when access needs reconnection and never represents read-only
consent as authority to move money.

Disconnecting a bank connection revokes the GoCardless requisition before local
deletion. Deleting the app account first attempts to revoke every active
provider requisition. Failed provider revocation fails the deletion request so
the user is not falsely told access was revoked.

The production privacy notice must explain the provider relationship, data
categories, purpose, legal basis, retention, withdrawal/revocation path,
international transfers if any, and applicable data-subject rights. Qualified
legal review must confirm controller/processor roles and jurisdiction-specific
wording before public launch.

## Export And Deletion

`GET /api/profile/export` returns a versioned JSON export containing the user's
profile, settings, identity metadata, session metadata, ledger, budgets, goals,
notifications, audit history, receipt metadata, and connected-bank/import
records.

`DELETE /api/profile` requires an authenticated request, CSRF protection, and
the exact confirmation value `DELETE`. It revokes provider access and then
deletes the user ownership root so related primary records cascade.

Deletion from the active database does not immediately remove a row from an
encrypted managed backup. The published privacy notice must state the actual
backup retention period and how restoration procedures prevent deleted data
from silently returning to active use.

## Retention

A daily server job applies configurable defaults:

- Expired or revoked sessions: 30 days after expiry/revocation.
- Expired verification and reset tokens: immediately after expiry.
- Old used verification and reset tokens: 7 days.
- Audit logs: 365 days.

Active financial records remain until the user deletes them or deletes the
account. Production values must match the published retention policy. Provider,
SMTP, log-monitoring, and backup systems need equivalent deletion/retention
configuration outside this repository.

## Logging And Incident Handling

Structured request logs contain request ID, method, path, status, and duration.
Application logs must not include passwords, cookies, CSRF/recovery tokens,
provider secrets, full bank payloads, or complete environment values.

Before launch, establish a privacy contact, incident owner, breach-assessment
procedure, subprocessor register, data-region record, access-review cadence,
and tested export/deletion support path. Repository code alone does not satisfy
those operational or legal obligations.
