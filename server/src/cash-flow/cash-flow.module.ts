import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CashFlowController } from "./cash-flow.controller";
import { CashFlowService } from "./cash-flow.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CashFlowController],
  providers: [CashFlowService],
})
export class CashFlowModule {}
