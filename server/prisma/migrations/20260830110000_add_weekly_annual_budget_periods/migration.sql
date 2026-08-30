-- Extend budget planning periods without changing existing budget records.
ALTER TYPE "BudgetPeriod" ADD VALUE 'WEEKLY';
ALTER TYPE "BudgetPeriod" ADD VALUE 'ANNUAL';
