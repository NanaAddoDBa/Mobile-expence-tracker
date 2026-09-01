import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { IncomesController } from "./incomes.controller";
import { IncomesService } from "./incomes.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [IncomesController],
  providers: [IncomesService],
})
export class IncomesModule {}
