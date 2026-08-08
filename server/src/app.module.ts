import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { ConnectedAccountsModule } from "./connected-accounts/connected-accounts.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { GoalsModule } from "./goals/goals.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    BudgetsModule,
    ConnectedAccountsModule,
    ExpensesModule,
    GoalsModule,
    HealthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
