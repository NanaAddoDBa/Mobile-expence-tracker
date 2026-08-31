import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ConnectedAccountsController } from "./connected-accounts.controller";
import { ConnectedAccountsService } from "./connected-accounts.service";
import { GoCardlessBankDataClient } from "./providers/gocardless-bank-data.client";
import { BankSyncScheduler } from "./bank-sync.scheduler";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ConnectedAccountsController],
  providers: [
    ConnectedAccountsService,
    GoCardlessBankDataClient,
    BankSyncScheduler,
  ],
  exports: [ConnectedAccountsService],
})
export class ConnectedAccountsModule {}
