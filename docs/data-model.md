# Data Model

The app should use a stable internal model that does not depend directly on any external provider model.

Core concepts:

- User
- UserSettings
- Expense
- Budget
- Goal
- Receipt
- ReceiptExtraction
- ConnectedAccount
- ExternalAccount
- ExternalTransaction
- ImportBatch
- ConsentRecord
- NotificationPreference
- Notification
- AuditLog

Provider-specific fields should stay isolated in provider metadata and adapter layers.

## Ownership Rule

Every user-owned backend row must include `userId`.

Every backend query for user-owned data must be scoped by the authenticated `userId`.

## Expense Source Model

Expense entry source describes how the expense entered the app:

```text
manual
receipt_scan
connected_account
recurring_forecast
```

Payment method describes how the expense was paid:

```text
cash
debit_card
credit_card
digital_wallet
bank_transfer
```

These values must not be mixed. A connected account source is not a payment method, and a receipt scan source is not a payment method.

## Expense Fields

Recommended backend fields:

```text
id
userId
merchant
description
amountMinor
currency
date
category
paymentMethod
entrySource
notes
isRecurring
recurringFrequency
recurringTemplateId
receiptId
connectedAccountId
externalTransactionId
importBatchId
createdAt
updatedAt
```

## Budget Fields

```text
id
userId
name
category
limitAmountMinor
currency
monthKey
status
createdAt
updatedAt
```

Budgets should be scoped to a currency. V1 budgets should use EUR only unless currency conversion support is implemented.

## Goal Fields

```text
id
userId
name
targetAmountMinor
savedAmountMinor
currency
targetDate
status
createdAt
updatedAt
```

Savings goals are planning records. They do not move real money.

## Receipt Fields

Receipt:

```text
id
userId
fileUrl
fileName
mimeType
status
linkedExpenseId
createdAt
updatedAt
```

Receipt extraction:

```text
id
receiptId
vendorName
transactionDate
totalAmountMinor
currency
category
paymentMethod
confidence
rawText
provider
createdAt
```

## Connected Account Fields

```text
id
userId
provider
displayName
status
consentId
lastSyncAt
needsReconnect
createdAt
updatedAt
```

External account:

```text
id
userId
connectedAccountId
providerAccountId
displayName
accountType
currency
maskedIdentifier
createdAt
updatedAt
```

## Import Fields

Import batch:

```text
id
userId
connectedAccountId
status
startedAt
finishedAt
newExpenseCount
duplicateCount
providerMessage
```

External transaction:

```text
id
userId
connectedAccountId
providerAccountId
externalTransactionId
importBatchId
postedDate
merchantName
description
amountMinor
currency
rawCategory
normalizedCategory
dedupeHash
createdAt
```

Imported expenses should link back to the connected account, external transaction, and import batch.
