import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
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
import { SecurityModule } from "./common/security/security.module";
import { ProfileModule } from "./profile/profile.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    SecurityModule,
    AuthModule,
    BudgetsModule,
    CashFlowModule,
    ConnectedAccountsModule,
    ExpensesModule,
    GoalsModule,
    HealthModule,
    IncomesModule,
    PrismaModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
