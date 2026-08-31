import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AuthProvider,
  Prisma,
  Session,
  User,
  UserStatus,
} from "@prisma/client";
import { CookieOptions } from "express";
import { PrismaService } from "../prisma/prisma.service";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "./auth.crypto";
import {
  AuthRequestContext,
  AuthSessionResult,
  GoogleAuthSessionResult,
  SafeUserResponse,
  ValidatedSession,
  VerifiedGoogleIdentity,
  toRequestUser,
  toSafeUser,
} from "./auth.types";
import {
  DEFAULT_BCRYPT_ROUNDS,
  DEFAULT_SESSION_TTL_DAYS,
} from "./constants";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

interface SessionLookup extends Session {
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async register(
    input: RegisterDto,
    context: AuthRequestContext,
  ): Promise<AuthSessionResult> {
    const email = this.normalizeEmail(input.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await hashPassword(
      input.password,
      this.getBcryptRounds(),
    );
    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = this.createSessionExpiry();

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email,
            name: input.name?.trim() || null,
            passwordHash,
            settings: {
              create: {},
            },
          },
        });

        await transaction.session.create({
          data: {
            userId: createdUser.id,
            tokenHash,
            expiresAt,
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
          },
        });

        return createdUser;
      });

      await this.writeAudit("AUTH_REGISTER", context, user.id);

      return {
        user: toSafeUser(user),
        sessionToken,
        expiresAt,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "An account with this email already exists",
        );
      }

      throw error;
    }
  }

  async login(
    input: LoginDto,
    context: AuthRequestContext,
  ): Promise<AuthSessionResult> {
    const email = this.normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      !user?.passwordHash ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      await this.writeAudit("AUTH_LOGIN_FAILED", context, user?.id);
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.createAuthenticatedSession(user, context, "AUTH_LOGIN");
  }

  async authenticateWithGoogle(
    identity: VerifiedGoogleIdentity,
    context: AuthRequestContext,
  ): Promise<GoogleAuthSessionResult> {
    const linkedIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: AuthProvider.GOOGLE,
          providerSubject: identity.subject,
        },
      },
    });

    if (linkedIdentity) {
      const user = await this.prisma.user.findUnique({
        where: { id: linkedIdentity.userId },
      });

      if (!user) {
        throw new UnauthorizedException("Google account is not available");
      }

      return {
        ...(await this.createAuthenticatedSession(
          user,
          context,
          "AUTH_GOOGLE_LOGIN",
        )),
        isNewUser: false,
      };
    }

    const email = this.normalizeEmail(identity.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(
        "An account with this email already exists. Sign in using its existing method.",
      );
    }

    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = this.createSessionExpiry();
    const now = new Date();

    try {
      const user = await this.prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email,
            name: identity.name,
            passwordHash: null,
            emailVerifiedAt: now,
            lastLoginAt: now,
            settings: {
              create: {},
            },
          },
        });

        await transaction.authIdentity.create({
          data: {
            userId: createdUser.id,
            provider: AuthProvider.GOOGLE,
            providerSubject: identity.subject,
            providerEmail: email,
          },
        });

        await transaction.session.create({
          data: {
            userId: createdUser.id,
            tokenHash,
            expiresAt,
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
          },
        });

        return createdUser;
      });

      await this.writeAudit("AUTH_GOOGLE_REGISTER", context, user.id);

      return {
        user: toSafeUser(user),
        sessionToken,
        expiresAt,
        isNewUser: true,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "This Google account is already connected to an account",
        );
      }

      throw error;
    }
  }

  async logout(
    sessionToken: string | undefined,
    context: AuthRequestContext,
  ): Promise<void> {
    if (!sessionToken) {
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
      },
    });

    if (!session || session.revokedAt) {
      return;
    }

    const result = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count > 0) {
      await this.writeAudit("AUTH_LOGOUT", context, session.userId);
    }
  }

  async validateSession(
    sessionToken: string | undefined,
  ): Promise<ValidatedSession | null> {
    if (!sessionToken) {
      return null;
    }

    const session = (await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(sessionToken) },
      include: { user: true },
    })) as SessionLookup | null;

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    if (session.user.status === UserStatus.DISABLED) {
      throw new ForbiddenException("This account is disabled");
    }

    return {
      sessionId: session.id,
      user: toRequestUser(session.user),
    };
  }

  async getCurrentUser(userId: string): Promise<SafeUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid session");
    }

    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException("This account is disabled");
    }

    return toSafeUser(user);
  }

  getSessionCookieOptions(expiresAt: Date): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: this.isCookieSecure(),
      path: "/",
      expires: expiresAt,
      maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
    };
  }

  getClearCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: this.isCookieSecure(),
      path: "/",
    };
  }

  private async createAuthenticatedSession(
    user: User,
    context: AuthRequestContext,
    auditAction: string,
  ): Promise<AuthSessionResult> {
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException("This account is disabled");
    }

    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = this.createSessionExpiry();
    const lastLoginAt = new Date();

    const updatedUser = await this.prisma.$transaction(
      async (transaction) => {
        const savedUser = await transaction.user.update({
          where: { id: user.id },
          data: { lastLoginAt },
        });

        await transaction.session.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
            userAgent: context.userAgent,
            ipAddress: context.ipAddress,
          },
        });

        return savedUser;
      },
    );

    await this.writeAudit(auditAction, context, updatedUser.id);

    return {
      user: toSafeUser(updatedUser),
      sessionToken,
      expiresAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private createSessionExpiry(): Date {
    const ttlMilliseconds =
      this.getSessionTtlDays() * 24 * 60 * 60 * 1000;

    return new Date(Date.now() + ttlMilliseconds);
  }

  private getSessionTtlDays(): number {
    return this.readPositiveInteger(
      "SESSION_TTL_DAYS",
      DEFAULT_SESSION_TTL_DAYS,
      365,
    );
  }

  private getBcryptRounds(): number {
    return this.readPositiveInteger(
      "BCRYPT_ROUNDS",
      DEFAULT_BCRYPT_ROUNDS,
      15,
    );
  }

  private readPositiveInteger(
    key: string,
    fallback: number,
    maximum: number,
  ): number {
    const configuredValue = this.config.get<string>(key);
    const parsedValue = Number(configuredValue);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue < 1 ||
      parsedValue > maximum
    ) {
      return fallback;
    }

    return parsedValue;
  }

  private isCookieSecure(): boolean {
    const configuredValue = this.config.get<string>("COOKIE_SECURE");

    if (configuredValue === "true") {
      return true;
    }

    if (configuredValue === "false") {
      return false;
    }

    return this.config.get<string>("NODE_ENV") === "production";
  }

  private async writeAudit(
    action: string,
    context: AuthRequestContext,
    userId?: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entityType: "User",
          userId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      });
    } catch {
      this.logger.warn(`Could not record ${action} audit event`);
    }
  }
}
