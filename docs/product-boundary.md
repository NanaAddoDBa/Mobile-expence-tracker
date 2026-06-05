# Product Boundary

Expense Tracker & Budget Manager is a spending awareness product. It should help users record expenses, review spending, create budgets, track savings goals, scan receipts, and import read-only transaction data when a backend integration exists.

The product must stay clearly scoped. It is not a banking control app, payment app, investment platform, tax tool, legal tool, or regulated advice product.

## Allowed Product Behavior

The app may:

- Track expenses.
- Import read-only transaction data.
- Categorize spending.
- Create budgets.
- Track savings goals manually.
- Scan receipts.
- Show spending summaries and budget observations.
- Help users understand spending patterns.
- Export user data.
- Delete user data.
- Notify users about budgets, recurring expenses, sync status, and reconnect needs.

## Disallowed Product Behavior

The app must not:

- Send money.
- Stop payments.
- Approve payments.
- Block cards.
- Move money into savings.
- Control bank accounts.
- Provide regulated investment advice.
- Provide tax advice.
- Provide legal advice.
- Store real banking credentials in the frontend.
- Store provider access tokens in browser local storage.

## Current Frontend Boundary

The current app is a mock-only frontend. Connected accounts are simulated. Receipt scanning uses mock OCR data. Authentication is local mock authentication. Local storage is only suitable for development and demonstration data.

## Future Backend Boundary

The first real backend milestone should support user-owned manual data only:

- Register and log in.
- Manage user settings.
- Create, edit, list, and delete expenses.
- Create, edit, list, and delete budgets.
- Create, edit, list, and delete goals.
- Export user data.
- Delete account data.
- Record audit logs for sensitive actions.

Open Banking should be added later as read-only account information access. Payment initiation is outside the product boundary.

## UX Boundary

User-facing copy should remain simple and practical:

- Use "Connected Accounts" for account data sources.
- Use "Import Expenses" for read-only transaction import.
- Use "Receipt Scan" for receipt-created expenses.
- Use "Add Savings" for manual savings goal contributions.

Avoid wording that implies the app can control bank accounts, stop transactions, move money, or give regulated advice.
