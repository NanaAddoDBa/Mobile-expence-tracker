# Visual QA Checklist

Use this checklist before shipping visual/UI changes.

## Mobile login/onboarding
- Login and onboarding fit without horizontal scrolling.
- Primary actions are easy to tap.
- Demo/local-data messaging is readable in light and dark mode.

## Mobile dashboard
- Summary cards stack cleanly.
- Search and action buttons fit on small screens.
- Charts and panels do not overflow.

## Mobile expenses
- Filters stack cleanly.
- Expense rows render as readable mobile cards.
- Empty states explain the next action.

## Mobile budgets
- Budget cards stack with readable progress and alert states.
- Add/edit budget dialogs fit and scroll.

## Mobile goals
- Goal cards and savings chart stay within the viewport.
- Add savings and edit dialogs fit and scroll.

## Mobile receipts
- Upload, preview, scan status, and review form stack cleanly.
- Receipt scanning states are readable.

## Mobile profile/settings
- Connected account flow is usable with touch.
- Tabs scroll safely without clipped labels.
- Settings controls have visible labels.

## Desktop layout
- Sidebar, header, and main content align consistently.
- Cards use consistent spacing, radius, and borders.

## Dark mode
- Text contrast is readable.
- Hover, selected, disabled, and focus states remain visible.
- Modals, tabs, badges, tables, and charts have distinct layers.

## Forms/dialogs
- Inputs have visible labels.
- Helper and error text is close to the field.
- Dialogs have accessible titles and scroll on mobile.

## Empty states
- Empty expenses, budgets, goals, receipts, connected accounts, and search results explain what happened.
- Each empty state gives a clear next action.

## Error states
- Errors use calm, practical language.
- Retry or recovery actions are clear when available.

## Connected account flow
- Institution selection, consent, provider redirect, callback, and
  success/error states are clear.
- Read-only language is visible for connected accounts, and mock-only language
  is visible specifically for receipt scanning.
- Import, reconnect, remove, and details actions are easy to find.

## Receipt scanning flow
- Mock OCR status is clear.
- Review form values are readable and editable.
- Linked receipt-created expenses show the correct source.
