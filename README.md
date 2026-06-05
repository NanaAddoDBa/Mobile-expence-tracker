# Expense Tracker & Budget Manager

A mobile-first, desktop-responsive frontend application for tracking expenses, managing budgets, reviewing spending patterns, scanning receipts with mock OCR, and testing a guided mock connected-account workflow.

This project is built as a realistic frontend foundation for a real-world expense tracker and budget manager. It uses local mock data and mock services for now, while keeping the structure ready for future backend, real authentication, Open Banking, and OCR integrations.

## Project Purpose

The goal of this app is to help users:

* Record manual expenses.
* Review expenses by category, source, and payment method.
* Create and monitor budgets.
* Track savings goals.
* Scan receipts using a mock OCR flow.
* Connect mock financial accounts through a guided read-only workflow.
* Import mock expenses from connected accounts.
* Manage local demo data, privacy actions, settings, and accessibility preferences.

The app is intentionally focused on expense tracking and budget management. It is not a banking app, payment app, investment platform, or regulated financial advice tool.

## Product Boundary

This project is mock-only in its current version.

It does **not**:

* Connect to real banks.
* Connect to real cards or digital wallets.
* Use real Open Banking APIs.
* Use real OCR APIs.
* Move money.
* Send payments.
* Stop, block, approve, or control payments.
* Store real banking credentials.
* Provide regulated financial, tax, legal, banking, or investment advice.

Connected accounts are simulated read-only mock connections. Receipt scanning uses mock OCR data. Authentication is local mock authentication. Data is stored locally for demo and development purposes only.

## Tech Stack

* Vite
* React
* TypeScript
* Tailwind CSS
* Vitest
* React Testing Library
* D3 for charting
* Lucide React icons
* Local mock repositories and services
* Browser local storage for mock persistence

## Core Features

### Expense Overview

The dashboard gives users an overview of their current expense tracking state. On first run, the app should start empty and guide the user toward setup actions such as:

* Add first expense
* Connect mock account
* Scan receipt
* Create budget
* Load sample data

When data exists, the dashboard summarizes spending, budgets, recent expenses, recurring expenses, source mix, and spending observations.

### Expenses

The Expenses feature supports:

* Manual expense creation
* Expense editing
* Expense deletion with confirmation
* Search and filtering
* Category and payment method metadata
* Source badges for Manual, Receipt, Imported, and Recurring expenses
* Imported expense metadata such as source account, import batch, and external transaction ID
* Receipt-created expense metadata such as receipt ID

Expense source and payment method are intentionally separate. For example, an expense may be imported from a connected account but still have a payment method such as debit card or digital wallet.

### Budget Manager

The Budget Manager supports:

* Creating category-based budgets
* Tracking spending against budget limits
* Budget status labels such as safe, warning, and over budget
* Budget observations based on expenses saved in the app

Budgets are planning limits created by the user or loaded through sample data. They are not bank-provided budgets.

### Savings Goals

The Goals feature supports:

* Creating savings goals
* Setting target amounts and target dates
* Recording manual savings contributions
* Viewing progress toward goals
* Showing planning calculations such as suggested monthly contribution

Savings goals are planning records only. The app does not move money into any real savings account.

### Receipt Scanning

The Receipts feature supports a mock receipt scanning workflow:

* Upload or simulate a receipt
* Run mock OCR extraction
* Review extracted vendor, date, total amount, category, payment method, and notes
* Save the reviewed receipt as an expense

Receipt-created expenses should preserve receipt source metadata and a receipt ID. No real OCR provider is used.

### Connected Accounts

The Connected Accounts feature simulates a real-world account-linking workflow without using real banking APIs.

The intended flow is:

1. Start connection
2. Review read-only consent
3. Choose mock provider
4. Simulate authorization
5. Select mock accounts
6. Confirm connection
7. Import expenses manually

Connecting an account does not automatically import expenses. Imported expenses appear only after the user chooses to import from a connected mock account.

Connected account cards should show account status, read-only access, last import state, imported expense count, reconnect action, remove action, and import result feedback.

### Profile and Settings

The Profile and Settings area includes:

* Connected Accounts
* Profile information
* Appearance
* Notifications
* Accessibility
* Privacy
* Security
* Demo Tools

Settings that are functional should persist locally. Settings that are not implemented as real backend features should be clearly marked as mock-only or coming later.

### Demo Tools

Demo Tools are used to control local sample data.

Expected demo actions include:

* Load starter sample data
* Reset sample data
* Clear app data
* Show local data counts
* Import from connected mock accounts when available

Sample data should be opt-in. The app should not silently create demo expenses, budgets, goals, or connected accounts on first run.

## Data Model Concepts

The app separates these concepts deliberately:

### Entry Source

How the expense entered the app.

Examples:

* `manual`
* `receipt_scan`
* `connected_account`
* `recurring_forecast`

### Payment Method

How the expense was paid.

Examples:

* `cash`
* `debit_card`
* `credit_card`
* `digital_wallet`
* `bank_transfer`

### Connected Account

A mock read-only source that can import mock transactions.

Examples:

* `checking`
* `savings`
* `credit_card`
* `digital_wallet`

These concepts should not be mixed. A connected account is not a payment method. A receipt source is not a payment method. A recurring forecast is not a real imported transaction.

## Architecture Overview

The project is organized around feature modules, domain models, providers, services, repositories, and shared UI components.

```text
src/
  app/
    providers/          App-level state providers
  components/
    ui/                 Shared UI primitives
    layout/             App shell and layout components
    feedback/           Dialogs, confirmation, and feedback UI
  data/                 Starter mock fixtures
  domain/               Domain types, constants, and rules
  features/             Feature-specific UI, hooks, and services
  hooks/                Shared React hooks
  lib/                  Shared utilities and validation
  services/
    adapters/           Mock external provider adapters
    demo/               Demo/sample data services
    repositories/       Mock persistence layer
    storage/            Storage adapter boundary
  tests/                Test utilities, builders, and workflow tests
```

### Architectural Boundaries

The intended direction is:

```text
UI component
→ feature hook
→ feature service
→ repository or provider adapter
→ mock storage / mock external service
```

UI components should not directly create mock account data, call raw mock provider functions, or own business rules that belong in domain or service layers.

## Local Data and Persistence

This frontend uses local mock persistence for development and portfolio demonstration.

Current local data may include:

* expenses
* budgets
* goals
* connected mock accounts
* notifications
* settings
* mock user profile
* onboarding state

This data is not secure banking storage. Do not store real credentials, real bank data, real card data, or sensitive personal data in this demo app.

Use Demo Tools or browser developer tools to clear local data during testing.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Serves the production build locally.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run lint:styles
```

Checks for suspicious Tailwind class fragments.

```bash
npm run typecheck
```

Runs TypeScript type checking.

```bash
npm run test
```

Runs the Vitest test suite.

```bash
npm run test:watch
```

Runs tests in watch mode.

## Recommended Local Verification

Before pushing or opening a pull request, run:

```bash
npm run lint
npm run lint:styles
npm run typecheck
npm run test
npm run build
```

Then manually check:

```text
1. Clear local storage.
2. Start the app with npm run dev.
3. Complete mock login/onboarding.
4. Confirm the dashboard starts empty.
5. Add a manual expense.
6. Create a budget.
7. Scan a mock receipt and save it as an expense.
8. Connect a mock account.
9. Confirm no expenses are imported automatically.
10. Import expenses from the connected account.
11. Import again and confirm duplicates are skipped.
12. Test settings, privacy export, clear data, and demo tools.
```

## Testing Strategy

The project uses Vitest and React Testing Library.

Test coverage should focus on:

* domain rules
* service logic
* repository behavior
* demo data actions
* receipt-to-expense flow
* connected account connection/import flow
* expense source metadata
* dashboard empty and active states
* settings behavior
* privacy and local data actions
* critical UI workflows

Tests should prefer user-visible behavior over implementation details.

## Manual QA

Manual QA checklists are available in:

```text
docs/qa-checklist.md
docs/visual-qa-checklist.md
```

Use these before publishing major changes.

## Current Limitations

This is a frontend-focused project. It does not yet include:

* production backend API
* real authentication
* real Open Banking integration
* real OCR integration
* encrypted server-side storage
* production session management
* real notification delivery
* complete accessibility audit
* end-to-end browser automation
* deployment pipeline

## Future Roadmap

Possible next improvements:

* Add real backend API boundary.
* Add production authentication.
* Add an Open Banking adapter behind the current mock provider interface.
* Add a real OCR adapter behind the current mock receipt service.
* Add encrypted server-side persistence.
* Add end-to-end tests.
* Improve modal focus trapping and keyboard accessibility.
* Improve receipt history and linked expense management.
* Add account removal options for keeping or deleting imported expenses.
* Add richer partial setup states on the dashboard.
* Add deployment documentation.

## Repository

Remote repository:

```text
git@github-nanaaddodb:NanaAddoDBa/Mobile-expence-tracker.git
```

Note: the repository name currently uses `expence`. Keep it if intentional, or rename it later if you want the spelling to be `expense`.

## License

No license has been selected yet. Add a license before sharing or reusing this project publicly.
