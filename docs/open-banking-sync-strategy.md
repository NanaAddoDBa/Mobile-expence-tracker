# Open Banking Sync Strategy

The implemented integration uses GoCardless Bank Account Data for read-only
account information and transaction import. It does not initiate payments,
block cards, move money, or collect online-banking credentials.

## Trust Boundary

The browser may select an institution and follow a provider consent URL. The
API alone owns provider application credentials, agreements, requisitions,
account discovery, balances, transactions, import records, and revocation.
Provider secrets and raw transaction payloads are never stored in browser
storage.

All connected-account routes require an authenticated user with a verified
email. Every connection, account, transaction, batch, and sync run is scoped by
that user's ID.

## Connection Lifecycle

1. The client requests institutions for a two-letter country code.
2. The user selects an institution.
3. The API creates an end-user agreement and requisition and returns the
   provider consent URL.
4. The provider redirects to `/api/connected-accounts/link/callback`.
5. The API validates requisition state, discovers provider accounts, persists
   consent/account metadata, and marks the connection ready or failed.
6. The client returns to the configured completed or failed app route.

Provider statuses are normalized before state transitions. Expired, rejected,
or otherwise inactive access becomes `NEEDS_RECONNECT`; a reconnect revokes the
old provider requisition before creating a replacement flow.

Removing a connection calls the provider's requisition-delete endpoint first,
then removes the local connection. Account deletion performs the same provider
revocation for every connection before deleting user data. A provider `404` on
delete is treated as already revoked.

## Import Lifecycle

Each manual or scheduled import:

1. Acquires an atomic, expiring PostgreSQL lease for the connection.
2. Creates an `AccountSyncRun`.
3. Revalidates consent and provider requisition state.
4. Creates an `ImportBatch` and fetches selected external accounts.
5. Fetches a bounded incremental date window and current balances.
6. Stores pending transactions without adding them to income or expenses.
7. Materializes booked EUR inflows as `Income` and booked EUR outflows as
   `Expense`.
8. Records imported, duplicate, pending, and failed counts.
9. Updates balance snapshots, sync/error state, and the next due time.
10. Releases the lease in a `finally` path, including failures.

After the first import, the next fetch overlaps the previous sync window. This
allows late bank updates while stable provider IDs, user-scoped uniqueness, and
a provider-independent deduplication hash prevent duplicate ledger entries.
Pending transactions can later become booked without creating two ledger rows.

Transfers are imported but categorized separately and excluded from operating
cash-flow totals. Non-EUR provider transactions and balances are not mixed into
the EUR ledger because no FX conversion source is implemented.

## Scheduling And Concurrency

The scheduler checks due connections every 15 minutes. It only runs imports
when `BANK_SYNC_ENABLED=true`; each successful sync sets `nextSyncAt` from
`BANK_SYNC_INTERVAL_MINUTES` (default six hours). Batch size and lease duration
are bounded by `BANK_SYNC_BATCH_SIZE` and `BANK_SYNC_LOCK_MINUTES`.

The database lease makes duplicate work across API replicas unlikely and
automatically expires after a crashed worker. A manual request against a leased
connection returns a conflict instead of starting a second import.

## Provider Resilience

- Requests have a bounded timeout.
- Idempotent GET and DELETE requests retry only for `429` and selected `5xx`
  responses.
- Retry delay honors a bounded `Retry-After` value.
- Token creation/refresh is cached and concurrent token requests share one
  in-flight operation.
- Provider errors are mapped to sanitized application state and sync records.
- Rate limits become `RATE_LIMITED` and defer the next sync.
- Expired access becomes `NEEDS_RECONNECT` and disables scheduled syncing until
  the user reconnects.

Retries are deliberately not applied to agreement or requisition creation,
because blindly repeating non-idempotent provider writes could create duplicate
resources.

## Production Configuration

Required when `BANK_CONNECTIONS_ENABLED=true`:

```ini
GOCARDLESS_BANK_DATA_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
GOCARDLESS_SECRET_ID=stored-in-secret-manager
GOCARDLESS_SECRET_KEY=stored-in-secret-manager
GOCARDLESS_DEFAULT_COUNTRY=DE
PUBLIC_API_URL=https://expenses.example.com
```

Enable scheduled imports only after provider production approval, final-hostname
callback testing, central logging, and sync-failure alerts are in place. Test a
real supported institution for consent completion, cancellation, pending-to-
booked promotion, duplicate imports, rate limiting, reconnect, and disconnect
before launch.

GoCardless institution coverage and transaction history vary by bank. The UI
must report provider errors and reconnect requirements without claiming that
every institution exposes the same freshness or history.
