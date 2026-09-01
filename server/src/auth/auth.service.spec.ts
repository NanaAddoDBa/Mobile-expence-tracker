import {
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AuthIdentity,
  AuthProvider,
  User,
  UserStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "./auth.crypto";
import { AuthService } from "./auth.service";

interface PrismaMock {
  authIdentity: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  session: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  auditLog: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
}

function createUser(overrides: Partial<User> = {}): User {
  const now = new Date();

  return {
    id: "user-1",
    email: "user@example.com",
    name: "Sample User",
    passwordHash: null,
    emailVerifiedAt: null,
    lastLoginAt: null,
    status: UserStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    authIdentity: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (transaction: PrismaMock) => Promise<unknown>) =>
      callback(prisma),
  );

  return prisma;
}

function createAuthIdentity(
  overrides: Partial<AuthIdentity> = {},
): AuthIdentity {
  const now = new Date();

  return {
    id: "identity-1",
    userId: "user-1",
    provider: AuthProvider.GOOGLE,
    providerSubject: "google-subject-1",
    providerEmail: "user@example.com",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createConfigMock(): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === "BCRYPT_ROUNDS") {
        return "4";
      }

      if (key === "SESSION_TTL_DAYS") {
        return "7";
      }

      if (key === "COOKIE_SECURE") {
        return "false";
      }

      return undefined;
    }),
  } as unknown as ConfigService;
}

describe("AuthService", () => {
  it("rejects duplicate registration emails", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(createUser());
    const service = new AuthService(
      prisma as unknown as PrismaService,
      createConfigMock(),
    );

    await expect(
      service.register(
        {
          email: "USER@example.com",
          password: "password123",
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects invalid credentials with a generic error", async () => {
    const prisma = createPrismaMock();
    const passwordHash = await hashPassword("correct-password", 4);
    prisma.user.findUnique.mockResolvedValue(
      createUser({ passwordHash }),
    );
    const service = new AuthService(
      prisma as unknown as PrismaService,
      createConfigMock(),
    );

    await expect(
      service.login(
        {
          email: "user@example.com",
          password: "incorrect-password",
        },
        {},
      ),
    ).rejects.toMatchObject<Partial<UnauthorizedException>>({
      message: "Invalid email or password",
    });

    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it("creates a passwordless account for a new Google identity", async () => {
    const prisma = createPrismaMock();
    const createdUser = createUser({
      email: "google.user@example.com",
      name: "Google User",
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    });
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(createdUser);
    prisma.authIdentity.create.mockResolvedValue(
      createAuthIdentity({
        providerSubject: "google-subject-new",
        providerEmail: createdUser.email,
      }),
    );
    prisma.session.create.mockResolvedValue({});
    const service = new AuthService(
      prisma as unknown as PrismaService,
      createConfigMock(),
    );

    const result = await service.authenticateWithGoogle(
      {
        subject: "google-subject-new",
        email: "GOOGLE.USER@example.com",
        name: "Google User",
      },
      {},
    );

    expect(result.isNewUser).toBe(true);
    expect(result.user.email).toBe("google.user@example.com");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "google.user@example.com",
        passwordHash: null,
        emailVerifiedAt: expect.any(Date),
      }),
    });
    expect(prisma.authIdentity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: AuthProvider.GOOGLE,
        providerSubject: "google-subject-new",
        userId: createdUser.id,
      }),
    });
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it("signs in the user linked to a returning Google identity", async () => {
    const prisma = createPrismaMock();
    const user = createUser();
    prisma.authIdentity.findUnique.mockResolvedValue(createAuthIdentity());
    prisma.user.findUnique.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({
      ...user,
      lastLoginAt: new Date(),
    });
    prisma.session.create.mockResolvedValue({});
    const service = new AuthService(
      prisma as unknown as PrismaService,
      createConfigMock(),
    );

    const result = await service.authenticateWithGoogle(
      {
        subject: "google-subject-1",
        email: user.email,
        name: user.name,
      },
      {},
    );

    expect(result.isNewUser).toBe(false);
    expect(result.user.id).toBe(user.id);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it("does not automatically link Google to an existing password account", async () => {
    const prisma = createPrismaMock();
    prisma.authIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(
      createUser({ passwordHash: "existing-password-hash" }),
    );
    const service = new AuthService(
      prisma as unknown as PrismaService,
      createConfigMock(),
    );

    await expect(
      service.authenticateWithGoogle(
        {
          subject: "unlinked-google-subject",
          email: "user@example.com",
          name: "Sample User",
        },
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.authIdentity.create).not.toHaveBeenCalled();
    expect(prisma.session.create).not.toHaveBeenCalled();
  });
});
