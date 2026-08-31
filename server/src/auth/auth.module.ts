import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { EmailVerifiedGuard } from "./email-verified.guard";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, EmailVerifiedGuard],
  exports: [AuthService, AuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}
