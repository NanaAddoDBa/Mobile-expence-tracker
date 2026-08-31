import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
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
import { validateEnvironment } from "./config/environment";
import { RequestContextMiddleware } from "./common/request/request-context.middleware";
import { RequestLoggingInterceptor } from "./common/request/request-logging.interceptor";
import { OperationsModule } from "./operations/operations.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: validateEnvironment,
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
    OperationsModule,
    PrismaModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({
      path: "{*path}",
      method: RequestMethod.ALL,
    });
  }
}
