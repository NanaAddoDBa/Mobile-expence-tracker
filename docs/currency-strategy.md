# Currency Strategy

Currency handling should be designed before real backend persistence or account import begins.

## Money Storage Rule

Do not use floating-point numbers for backend money calculations.

Use minor units:

```ts
amountMinor: number;
currency: string;
```

Examples:

```text
EUR 12.50 -> amountMinor = 1250, currency = "EUR"
GBP 9.99 -> amountMinor = 999, currency = "GBP"
```

## Optional Conversion Fields

When currency conversion exists later, store both original and converted values:

```ts
originalAmountMinor?: number;
originalCurrency?: string;
exchangeRate?: string;
convertedAmountMinor?: number;
convertedCurrency?: string;
```

Use a decimal string for exchange rates to avoid floating-point drift.

## V1 Rule

For Backend V1:

```text
User base currency = EUR
Budgets are EUR only
EUR expenses count toward budgets
Non-EUR expenses are stored but excluded from budget totals until FX support exists
```

This avoids silently mixing currencies.

## Frontend Display

The frontend should display money with locale-aware formatting, but calculations should use backend-provided minor-unit values when real APIs exist.

The current frontend may continue using decimal amounts for mock-only UI state until the backend API boundary introduces minor-unit payloads.

## Import Rule

Imported transactions must preserve provider currency:

- Store original amount and currency.
- Normalize category separately from currency.
- Do not convert imported amounts unless the backend has a reliable exchange-rate source.

## Budget Rule

Budgets should explicitly include currency.

If a user has EUR budgets and imports a non-EUR expense before conversion support exists, that expense should not affect EUR budget progress.
