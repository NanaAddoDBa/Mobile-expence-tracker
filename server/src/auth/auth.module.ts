import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { AccountRecoveryService } from "./account-recovery.service";
import { AccountSecurityService } from "./account-security.service";
import { EmailService } from "./email.service";
import { GoogleIdentityService } from "./google-identity.service";
import { EmailVerifiedGuard } from "./email-verified.guard";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    GoogleIdentityService,
    AccountRecoveryService,
    AccountSecurityService,
    EmailService,
    EmailVerifiedGuard,
  ],
  exports: [AuthService, AuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}
