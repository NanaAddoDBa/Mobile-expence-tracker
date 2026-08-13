import {
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { Prisma, Session, User, UserStatus } from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/errors/http-exception.filter";
import { PrismaService } from "../src/prisma/prisma.service";

class InMemoryPrisma {
  private users: User[] = [];
  private sessions: Session[] = [];
  private sequence = 0;

  readonly user = {
    findUnique: async (
      args: Prisma.UserFindUniqueArgs,
    ): Promise<User | null> => {
      if (args.where.email) {
        return (
          this.users.find((user) => user.email === args.where.email) ?? null
        );
      }

      if (args.where.id) {
        return this.users.find((user) => user.id === args.where.id) ?? null;
      }

      return null;
    },
    create: async (args: Prisma.UserCreateArgs): Promise<User> => {
      const data = args.data as Prisma.UserUncheckedCreateInput;
      const now = new Date();
      const user: User = {
        id: data.id || this.nextId("user"),
        email: data.email,
        name: data.name ?? null,
        passwordHash: data.passwordHash ?? null,
        emailVerifiedAt: data.emailVerifiedAt
          ? new Date(data.emailVerifiedAt)
          : null,
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
        status: data.status ?? UserStatus.ACTIVE,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      };

      this.users.push(user);
      return user;
    },
    update: async (args: Prisma.UserUpdateArgs): Promise<User> => {
      const id = args.where.id;
      const user = this.users.find((candidate) => candidate.id === id);

      if (!user) {
        throw new Error("User not found");
      }

      const data = args.data as Prisma.UserUncheckedUpdateInput;

      if (data.lastLoginAt instanceof Date) {
        user.lastLoginAt = data.lastLoginAt;
      }

      user.updatedAt = new Date();
      return user;
    },
  };

  readonly session = {
    create: async (args: Prisma.SessionCreateArgs): Promise<Session> => {
      const data = args.data as Prisma.SessionUncheckedCreateInput;
      const now = new Date();
      const session: Session = {
        id: data.id || this.nextId("session"),
        userId: data.userId,
        tokenHash: data.tokenHash,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
        expiresAt: new Date(data.expiresAt),
        revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      };

      this.sessions.push(session);
      return session;
    },
    findUnique: async (
      args: Prisma.SessionFindUniqueArgs,
    ): Promise<(Session & { user?: User }) | null> => {
      const session =
        this.sessions.find(
          (candidate) => candidate.tokenHash === args.where.tokenHash,
        ) ?? null;

      if (!session) {
        return null;
      }

      if (args.include?.user) {
        const user =
          this.users.find((candidate) => candidate.id === session.userId) ??
          undefined;

        return { ...session, user };
      }

      return { ...session };
    },
    updateMany: async (
      args: Prisma.SessionUpdateManyArgs,
    ): Promise<Prisma.BatchPayload> => {
      const session = this.sessions.find(
        (candidate) =>
          candidate.id === args.where?.id && candidate.revokedAt === null,
      );

      if (!session) {
        return { count: 0 };
      }

      const data = args.data as Prisma.SessionUncheckedUpdateManyInput;
      session.revokedAt =
        data.revokedAt instanceof Date ? data.revokedAt : new Date();
      session.updatedAt = new Date();

      return { count: 1 };
    },
  };

  readonly auditLog = {
    create: async (args: Prisma.AuditLogCreateArgs) => ({
      id: this.nextId("audit"),
      userId: args.data.userId ?? null,
      action: args.data.action,
      entityType: args.data.entityType ?? null,
      entityId: args.data.entityId ?? null,
      metadata: null,
      ipAddress: args.data.ipAddress ?? null,
      userAgent: args.data.userAgent ?? null,
      createdAt: new Date(),
    }),
  };

  async $transaction<T>(
    callback: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return callback(this as unknown as Prisma.TransactionClient);
  }

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }
}

describe("Auth API (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.BCRYPT_ROUNDS = "4";
    process.env.COOKIE_SECURE = "false";
    process.env.SESSION_TTL_DAYS = "7";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(new InMemoryPrisma())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: false,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const registration = {
    email: "user@example.com",
    password: "password123",
    name: "Sample User",
  };

  it("registers a user and sets an HttpOnly session cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(registration)
      .expect(201);
    const cookies = getSetCookies(response.headers["set-cookie"]);

    expect(response.body.data.user).toMatchObject({
      email: registration.email,
      name: registration.name,
      status: UserStatus.ACTIVE,
    });
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(cookies.join(";")).toContain("exp_tracker_session=");
    expect(cookies.join(";")).toContain("HttpOnly");
    expect(cookies.join(";")).toContain("SameSite=Lax");
  });

  it("logs in and sets a new session cookie", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(registration)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: registration.email,
        password: registration.password,
      })
      .expect(200);

    expect(response.body.data.user.email).toBe(registration.email);
    expect(getSetCookies(response.headers["set-cookie"]).join(";")).toContain(
      "exp_tracker_session=",
    );
  });

  it("returns the current user for a valid session cookie", async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post("/api/auth/register")
      .send(registration)
      .expect(201);

    const response = await agent.get("/api/auth/me").expect(200);

    expect(response.body.data.user).toMatchObject({
      email: registration.email,
      name: registration.name,
    });
  });

  it("rejects the current-user endpoint without a session", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/auth/me")
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  });

  it("logs out, clears the cookie, and revokes the session", async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post("/api/auth/register")
      .send(registration)
      .expect(201);

    const logoutResponse = await agent
      .post("/api/auth/logout")
      .expect(200);

    expect(logoutResponse.body).toEqual({
      data: { success: true },
    });
    expect(
      getSetCookies(logoutResponse.headers["set-cookie"]).join(";"),
    ).toContain("exp_tracker_session=;");

    await agent.get("/api/auth/me").expect(401);
  });

  it("returns conflict for a duplicate registration email", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(registration)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        ...registration,
        email: "USER@example.com",
      })
      .expect(409);

    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("returns a generic unauthorized response for invalid login", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "missing@example.com",
        password: "wrong-password",
      })
      .expect(401);

    expect(response.body.error).toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  });
});

function getSetCookies(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" ? [value] : [];
}
