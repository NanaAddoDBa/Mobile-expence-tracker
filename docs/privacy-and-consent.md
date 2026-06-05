# Privacy and Consent

This document defines engineering and product requirements for privacy-aware backend design. It is not legal advice.

The app handles financial data even before Open Banking is added. Backend V1 should follow data protection by design and by default: collect only what is needed, scope all data by user, protect sensitive records, and provide export/delete behavior from the start.

## Data Minimization

Backend V1 should store only data needed for:

- Authentication.
- User profile.
- Settings.
- Expenses.
- Budgets.
- Goals.
- Data export.
- Account data deletion.
- Audit logs for sensitive actions.

Backend V1 should not collect:

- Real bank credentials.
- Real card credentials.
- Real wallet credentials.
- Open Banking provider tokens.
- Real OCR provider payloads.
- Payment initiation data.
- Investment, tax, legal, or banking advice data.

## User Ownership

Every user-owned record must include `userId`.

Every API query must scope by the authenticated `userId`.

The backend must not trust a `userId` supplied by the frontend for ownership decisions.

## Export Data Behavior

Backend V1 must include `GET /data-export`.

The export should include supported user data:

- User profile.
- Settings.
- Expenses.
- Budgets.
- Goals.
- User-visible audit log summary where appropriate.

The export must not include:

- Password hashes.
- Session secrets.
- Internal auth metadata.
- Provider tokens.
- Encryption metadata.
- Secrets or environment configuration.

Export actions should write an audit log event.

## Delete Data Behavior

Backend V1 must include `DELETE /account-data`.

Deletion should remove supported user-owned application data:

- Settings.
- Expenses.
- Budgets.
- Goals.
- Future placeholder records when implemented.

Deletion should invalidate sessions when appropriate and write an audit log event.

Audit log retention after deletion must be documented before production.

## Retention Assumptions

Backend V1 assumptions:

- Active user data is retained until the user deletes it.
- Deleted user application data is removed from primary tables.
- Backups may retain deleted data temporarily according to a documented backup retention period.
- Audit logs may be retained only for security and operational needs.

Production requires a clear retention policy before launch.

## Audit Logging

Backend V1 should audit:

- Register.
- Login.
- Logout.
- Data export.
- Account data deletion.
- Expense delete.
- Budget delete.
- Goal delete.

Audit metadata must stay minimal and must not include raw secrets, passwords, provider tokens, or unnecessary financial detail.

## Frontend Local Storage Restrictions

The frontend must never store:

- Real banking credentials.
- Provider access tokens.
- Provider refresh tokens.
- Session secrets.
- Real card or wallet credentials.
- Sensitive financial data intended for production persistence.

Mock local storage is acceptable only for local development/demo behavior before real backend persistence exists.

## Future Open Banking Consent Lifecycle

Future Open Banking must include:

- Consent records.
- Consent status.
- Consent granted timestamp.
- Consent expiry timestamp.
- Reconnect state.
- Provider metadata.
- Encrypted provider tokens stored on the backend only.
- Account removal behavior.
- Imported data retention/deletion choice.

The frontend should only show consent status and user actions. It must not receive or store provider tokens.

## Provider Responsibilities

Before production, document provider responsibilities for:

- Hosting.
- Database.
- Authentication.
- Object storage.
- Open Banking.
- OCR.
- Email/push notifications.
- Monitoring and logging.

For each provider, record what data is processed, region, retention behavior, and security responsibilities.
