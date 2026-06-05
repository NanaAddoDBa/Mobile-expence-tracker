# QA Checklist

## Setup

- Run `npm install`.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run test`.
- Run `npm run build`.
- Run `npm run dev`.

## Core Flows

- Complete onboarding and confirm the app enters the dashboard.
- Add an expense and confirm it appears in Expenses.
- Edit an expense and confirm the changed values are shown.
- Delete an expense and confirm the app confirmation dialog appears first.
- Connect a mock account and confirm the read-only consent copy is shown.
- Import expenses from a mock connected account.
- Import again and confirm duplicate mock expenses are skipped.
- Reconnect a mock account.
- Remove a mock account and confirm imported expenses remain in the expense list.
- Create a budget.
- Add enough expense activity to show an overspending warning.
- Create a goal.
- Add savings manually and confirm the goal progress updates.
- Upload a receipt and confirm the mock scan review step appears.
- Save a receipt scan as an expense and confirm the expense appears with receipt metadata.
- Switch Light, Dark, and System theme modes.
- Review Profile and Settings sections.

## Responsive QA

- Check mobile layout at 375px width.
- Check tablet layout.
- Check desktop layout.
- Check dark mode.
- Use keyboard navigation for dialogs, tabs, primary buttons, and forms.

## Release QA

- Confirm there are no console errors during normal use.
- Confirm `npm run lint:styles` reports no suspicious Tailwind class fragments.
- Confirm production build passes.
- Confirm demo mode copy is clear.
- Confirm the app makes no real banking, payment, OCR, tax, legal, investment, or regulated finance claims.
- Confirm mock connected accounts remain read-only.
- Confirm receipt scanning uses mock/local scan data only.
