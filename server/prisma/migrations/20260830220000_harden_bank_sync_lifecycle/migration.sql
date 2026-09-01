CREATE TYPE "TransactionBookingStatus" AS ENUM ('PENDING', 'BOOKED');

ALTER TABLE "ConnectedAccount"
ADD COLUMN "nextSyncAt" TIMESTAMP(3),
ADD COLUMN "syncLockToken" TEXT,
ADD COLUMN "syncLockExpiresAt" TIMESTAMP(3);

ALTER TABLE "ExternalAccount"
ADD COLUMN "currentBalanceMinor" INTEGER,
ADD COLUMN "availableBalanceMinor" INTEGER,
ADD COLUMN "balanceUpdatedAt" TIMESTAMP(3);

ALTER TABLE "ImportBatch"
ADD COLUMN "pendingCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ExternalTransaction"
ADD COLUMN "bookingStatus" "TransactionBookingStatus" NOT NULL DEFAULT 'BOOKED',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ConnectedAccount_status_nextSyncAt_idx"
ON "ConnectedAccount"("status", "nextSyncAt");

CREATE INDEX "ExternalTransaction_userId_bookingStatus_idx"
ON "ExternalTransaction"("userId", "bookingStatus");
