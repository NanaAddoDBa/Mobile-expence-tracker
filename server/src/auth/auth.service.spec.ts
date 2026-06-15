import {
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "./auth.crypto";
import { AuthService } from "./auth.service";

interface PrismaMock {
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
});
