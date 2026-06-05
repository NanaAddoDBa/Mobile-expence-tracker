# Privacy and Consent

The real backend must be privacy-aware from the first milestone. Privacy, consent, user data ownership, retention, export, and deletion should not be added as final polish.

This document is product and engineering guidance, not legal advice.

## Data Classification

Classify data before storing it:

- Account data: connected account metadata, external account metadata, consent state.
- Financial data: expenses, budgets, goals, transactions, receipts, receipt extractions.
- Identity data: user profile, email, authentication identifier.
- Preference data: settings, notification preferences, theme, accessibility settings.
- Operational data: audit logs, sync runs, import batches, error categories.
- Sensitive secrets: session secrets, provider tokens, encryption keys.

Sensitive secrets must never be stored in browser local storage.

## User Ownership

User data belongs to the user. The backend must support:

- Data export.
- Data deletion.
- Account deletion.
- Consent withdrawal.
- Clear account removal behavior.

Every user-owned record must be scoped to the authenticated `userId`.

## Consent Model

Connected account consent should record:

- Provider.
- Consent status.
- Consent grant timestamp.
- Consent expiry timestamp when available.
- Requested account information scope.
- Last successful sync timestamp.
- Last failed sync timestamp.
- Reconnect requirement.
- Removal preference.

Users should understand that connected accounts are used for read-only transaction import.

## Retention Rules

Define retention before launch:

- Deleted user data should be removed from primary application tables.
- Audit logs may be retained only as required for security and operations.
- Provider tokens must be deleted when account access is removed.
- Receipt files should be deleted when the user deletes receipt data or account data.
- Backups need a documented retention period.

## Export Behavior

The export endpoint should include:

- Profile data.
- Settings.
- Expenses.
- Budgets.
- Goals.
- Receipts and receipt metadata.
- Connected account metadata.
- Import history.
- Notifications.
- Audit log summary where appropriate.

Do not include secrets, password hashes, provider tokens, or internal encryption metadata in exports.

## Delete Behavior

The delete endpoint should:

- Require authentication.
- Delete user-owned application data.
- Delete provider tokens and connected account records.
- Delete receipt file references and queued receipt work.
- Record a minimal audit event if required.
- Return a clear completion result.

## Vendor and Hosting Responsibilities

Before production, maintain a vendor register for:

- Hosting.
- Database.
- Object storage.
- Authentication.
- Open Banking provider.
- OCR provider.
- Email or push notification provider.
- Monitoring and logging.

For each vendor, record the data processed, region, retention behavior, and security responsibilities.
