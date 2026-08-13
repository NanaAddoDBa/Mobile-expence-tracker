import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ConnectedAccountsController } from "./connected-accounts.controller";
import { ConnectedAccountsService } from "./connected-accounts.service";
import { GoCardlessBankDataClient } from "./providers/gocardless-bank-data.client";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ConnectedAccountsController],
  providers: [ConnectedAccountsService, GoCardlessBankDataClient],
})
export class ConnectedAccountsModule {}
