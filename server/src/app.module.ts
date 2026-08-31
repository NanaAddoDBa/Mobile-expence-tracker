import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BudgetsModule } from "./budgets/budgets.module";
import { CashFlowModule } from "./cash-flow/cash-flow.module";
import { ConnectedAccountsModule } from "./connected-accounts/connected-accounts.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { GoalsModule } from "./goals/goals.module";
import { HealthModule } from "./health/health.module";
import { IncomesModule } from "./incomes/incomes.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    AuthModule,
    BudgetsModule,
    CashFlowModule,
    ConnectedAccountsModule,
    ExpensesModule,
    GoalsModule,
    HealthModule,
    IncomesModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
