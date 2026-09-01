# Currency Strategy

The implemented backend is deliberately EUR-only: integer minor units and no
implicit FX conversion.

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

## Current Rule

For Backend V1:

```text
User base currency = EUR
Budgets are EUR only
EUR expenses count toward budgets
Non-EUR ledger writes and bank imports are rejected or skipped until FX support exists
```

This avoids silently mixing currencies.

## Store Currency With Every Money Field

Every persisted money field should store currency next to the amount:

- Expense `amountMinor` and `currency`.
- Budget `limitAmountMinor` and `currency`.
- Goal `targetAmountMinor`, `currentAmountMinor`, and `currency`.
- Imported transaction `amountMinor` and `currency`.

Do not infer currency from locale, user profile, or provider alone.

## Frontend Display

The frontend displays money with locale-aware formatting and maps decimal form
values to integer-minor-unit API payloads. Financial totals come from
server-backed ledger data.

## Import Rule

Imported source transactions preserve provider currency, but the current ledger
materializes EUR transactions only:

- Store original amount and currency.
- Normalize category separately from currency.
- Do not convert imported amounts unless the backend has a reliable exchange-rate source.

## Budget Rule

Budgets should explicitly include currency.

Non-EUR provider transactions do not create current ledger rows and therefore
cannot affect EUR budget progress.

## Future FX Placeholder

Future FX support should define:

- Source of exchange rates.
- Rate timestamp.
- Original amount and original currency.
- Converted amount and converted currency.
- Rounding behavior.
- Whether converted values affect budgets.

Until that exists, do not mix non-EUR values into the active ledger, budgets,
goals, cash-flow totals, or balance summaries.
