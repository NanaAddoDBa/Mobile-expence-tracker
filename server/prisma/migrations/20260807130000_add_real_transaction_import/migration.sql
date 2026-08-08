ALTER TYPE "ConnectedAccountStatus" ADD VALUE IF NOT EXISTS 'CONNECTING';

ALTER TABLE "ConnectedAccount"
  ADD COLUMN "providerInstitutionId" TEXT,
  ADD COLUMN "providerAgreementId" TEXT,
  ADD COLUMN "consentExpiresAt" TIMESTAMP(3);

ALTER TABLE "ExternalAccount"
  ADD COLUMN "isSelected" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ExternalTransaction"
  ADD COLUMN "connectedAccountId" TEXT;

CREATE INDEX "ConnectedAccount_provider_providerConnectionId_idx"
  ON "ConnectedAccount"("provider", "providerConnectionId");

CREATE INDEX "ExternalTransaction_connectedAccountId_idx"
  ON "ExternalTransaction"("connectedAccountId");

ALTER TABLE "ExternalTransaction"
  ADD CONSTRAINT "ExternalTransaction_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
