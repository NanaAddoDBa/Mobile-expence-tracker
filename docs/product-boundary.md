# Product Boundary

Expense Tracker & Budget Manager is a spending awareness product. It helps
users record income and expenses, review cash flow, create budgets, track
savings goals, and import read-only transaction data. Receipt scanning remains
a mock review feature until a secure backend upload/OCR service is implemented.

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

## Current Application Boundary

The React client uses the NestJS/PostgreSQL API for authentication, profile and
settings, income, expenses, cash flow, budgets, goals, privacy operations, and
connected accounts. GoCardless Bank Account Data provides the implemented
read-only consent and transaction-import path when enabled.

The backend currently supports:

- Register, verify email, log in, recover/change a password, and manage sessions.
- Sign in with a verified Google identity.
- Manage user settings.
- Create, edit, list, and delete income.
- Create, edit, list, and delete expenses.
- Create, edit, list, and delete budgets.
- Create, edit, list, and delete goals.
- Review net cash flow and savings rate.
- Connect, sync, reconnect, and disconnect read-only bank accounts.
- Export user data.
- Delete account data.
- Record audit logs for sensitive actions.

The receipt UI still uses mock OCR data and must be presented that way. Real
receipt storage/OCR and automated notification delivery are outside the current
backend. Payment initiation remains outside the product boundary.

## UX Boundary

User-facing copy should remain simple and practical:

- Use "Connected Accounts" for account data sources.
- Use "Import Expenses" for read-only transaction import.
- Use "Receipt Scan" for receipt-created expenses.
- Use "Add Savings" for manual savings goal contributions.

Avoid wording that implies the app can control bank accounts, stop transactions, move money, or give regulated advice.
