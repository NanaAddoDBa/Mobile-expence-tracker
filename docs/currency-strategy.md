# Currency Strategy

Currency handling should be designed before real backend persistence or account import begins. Backend V1 should be simple and deterministic: EUR first, integer minor units, no implicit FX conversion.

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

## Backend V1 Rule

For Backend V1:

```text
User base currency = EUR
Budgets are EUR only
EUR expenses count toward budgets
Non-EUR expenses are stored but excluded from budget totals until FX support exists
```

This avoids silently mixing currencies.

## Store Currency With Every Money Field

Every persisted money field should store currency next to the amount:

- Expense `amountMinor` and `currency`.
- Budget `limitAmountMinor` and `currency`.
- Goal `targetAmountMinor`, `currentAmountMinor`, and `currency`.
- Future imported transaction amount and currency.

Do not infer currency from locale, user profile, or provider alone.

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

## Future FX Placeholder

Future FX support should define:

- Source of exchange rates.
- Rate timestamp.
- Original amount and original currency.
- Converted amount and converted currency.
- Rounding behavior.
- Whether converted values affect budgets.

Until that exists, store non-EUR expenses later as original values and exclude them from EUR budget totals.
