-- CreateEnum
CREATE TYPE "IncomeCategory" AS ENUM ('SALARY', 'FREELANCE', 'BUSINESS', 'INVESTMENT', 'BENEFITS', 'GIFT', 'REFUND', 'REIMBURSEMENT', 'TRANSFERS', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- AlterTable
ALTER TABLE "ExternalTransaction"
ADD COLUMN "direction" "TransactionDirection" NOT NULL DEFAULT 'OUTFLOW',
ADD COLUMN "normalizedIncomeCategory" "IncomeCategory";

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'EUR',
    "date" TIMESTAMP(3) NOT NULL,
    "category" "IncomeCategory" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "entrySource" "EntrySource" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "sourceAccountId" TEXT,
    "importBatchId" TEXT,
    "externalTransactionId" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" "RecurringFrequency",
    "recurringTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Income_userId_externalTransactionId_key" ON "Income"("userId", "externalTransactionId");

-- CreateIndex
CREATE INDEX "Income_userId_idx" ON "Income"("userId");

-- CreateIndex
CREATE INDEX "Income_userId_date_idx" ON "Income"("userId", "date");

-- CreateIndex
CREATE INDEX "Income_userId_category_idx" ON "Income"("userId", "category");

-- CreateIndex
CREATE INDEX "Income_userId_entrySource_idx" ON "Income"("userId", "entrySource");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "ConnectedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
