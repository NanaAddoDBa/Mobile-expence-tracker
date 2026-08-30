-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('DAILY', 'MONTHLY');

-- Preserve all existing budgets as monthly budgets.
ALTER TABLE "Budget"
ADD COLUMN "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN "periodKey" TEXT;

UPDATE "Budget"
SET "periodKey" = "monthKey";

-- Replace monthly-only indexes with period-aware indexes.
DROP INDEX "Budget_userId_monthKey_idx";
DROP INDEX "Budget_userId_category_monthKey_key";

ALTER TABLE "Budget"
ALTER COLUMN "periodKey" SET NOT NULL,
DROP COLUMN "monthKey";

CREATE INDEX "Budget_userId_period_periodKey_idx"
ON "Budget"("userId", "period", "periodKey");

CREATE UNIQUE INDEX "Budget_userId_category_period_periodKey_key"
ON "Budget"("userId", "category", "period", "periodKey");
