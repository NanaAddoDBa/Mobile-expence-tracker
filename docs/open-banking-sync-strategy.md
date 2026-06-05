# Open Banking Sync Strategy

Open Banking should be added only after backend authentication, database persistence, expenses, budgets, goals, and receipt backend flows are stable.

The integration must be read-only account information access. Payment initiation is out of scope.

## Architecture Rule

The frontend must never store provider access tokens.

The backend owns:

- Provider session creation.
- Provider callback handling.
- Token exchange.
- Token encryption.
- Consent records.
- Account fetching.
- Transaction fetching.
- Import batches.
- Deduplication.
- Sync status.

The frontend owns:

- Starting the connection.
- Showing consent and status messages.
- Letting the user choose available accounts when supported.
- Triggering manual import when allowed.
- Showing import results and reconnect states.

## Provider Adapter Boundary

Provider-specific models should be mapped into internal models:

```text
provider response
-> provider adapter
-> ExternalAccount / ExternalTransaction
-> import service
-> Expense
```

The app should not depend directly on a provider transaction shape.

## Connection Lifecycle

Track the connection lifecycle:

```text
connection_started
consent_granted
authorization_completed
accounts_received
account_selected
transactions_imported
sync_failed
rate_limited
consent_expiring
needs_reconnect
reconnected
connection_removed
data_retained
data_deleted
```

## Import Behavior

Transaction import should be deterministic and auditable:

```text
Fetch transactions
Normalize provider data
Map categories
Compute dedupe hash
Create import batch
Save only new transactions
Record skipped duplicates
Return import result
```

## Deduplication

Deduplication should use stable values when available:

- Provider transaction ID.
- Provider account ID.
- Posted date.
- Amount.
- Currency.
- Merchant or description.

If a provider transaction ID exists, it should be the strongest dedupe signal.

## Rate Limits and Cooldowns

The app should not fetch transactions on every dashboard load.

Track:

- Last successful sync.
- Last failed sync.
- Manual sync cooldown.
- Provider rate-limit state.
- Retry eligibility.
- Reconnect requirement.

User-facing messages should be simple:

- "Last synced today at 14:30."
- "No new expenses found."
- "Imported 12 new expenses."
- "Skipped 4 duplicates."
- "Sync limit reached. Try again later."
- "Reconnect required before importing."

## Account Removal

When a user removes a connected account, the app must define whether imported expenses are kept or deleted.

Recommended V1 behavior:

- Default to keeping imported expenses.
- Delete provider tokens and connection metadata.
- Mark retained imported expenses as historical app expenses.
- Offer delete-imported-expenses behavior only after the data model supports it safely.
