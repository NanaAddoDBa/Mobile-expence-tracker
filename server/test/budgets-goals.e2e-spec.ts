import {
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import {
  Budget,
  CurrencyCode,
  Goal,
  GoalStatus,
  Prisma,
  Session,
  User,
  UserStatus,
} from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/errors/http-exception.filter";
import { PrismaService } from "../src/prisma/prisma.service";

class InMemoryPrisma {
  private users: User[] = [];
  private sessions: Session[] = [];
  private budgets: Budget[] = [];
  private goals: Goal[] = [];
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
      const user = this.users.find((candidate) => candidate.id === args.where.id);

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

      session.revokedAt = new Date();
      session.updatedAt = new Date();
      return { count: 1 };
    },
  };

  readonly budget = {
    findMany: async (args: Prisma.BudgetFindManyArgs): Promise<Budget[]> => {
      return this.filterBudgets(args.where).map((budget) => ({ ...budget }));
    },
    create: async (args: Prisma.BudgetCreateArgs): Promise<Budget> => {
      const data = args.data as Prisma.BudgetUncheckedCreateInput;
      const now = new Date();
      const budget: Budget = {
        id: data.id || this.nextId("budget"),
        userId: data.userId,
        category: data.category,
        limitAmountMinor: data.limitAmountMinor,
        currency: data.currency ?? CurrencyCode.EUR,
        monthKey: data.monthKey,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      };

      this.budgets.push(budget);
      return { ...budget };
    },
    findFirst: async (
      args: Prisma.BudgetFindFirstArgs,
    ): Promise<Budget | { id: string } | null> => {
      const budget = this.filterBudgets(args.where)[0] ?? null;

      if (!budget) {
        return null;
      }

      if (args.select?.id) {
        return { id: budget.id };
      }

      return { ...budget };
    },
    update: async (args: Prisma.BudgetUpdateArgs): Promise<Budget> => {
      const budget = this.budgets.find(
        (candidate) => candidate.id === args.where.id,
      );

      if (!budget) {
        throw new Error("Budget not found");
      }

      const data = args.data as Prisma.BudgetUncheckedUpdateInput;
      Object.assign(budget, {
        ...data,
        updatedAt: new Date(),
      });

      return { ...budget };
    },
    deleteMany: async (
      args: Prisma.BudgetDeleteManyArgs,
    ): Promise<Prisma.BatchPayload> => {
      const before = this.budgets.length;
      this.budgets = this.budgets.filter(
        (budget) =>
          budget.id !== args.where?.id || budget.userId !== args.where?.userId,
      );

      return { count: before - this.budgets.length };
    },
  };

  readonly goal = {
    findMany: async (args: Prisma.GoalFindManyArgs): Promise<Goal[]> => {
      return this.filterGoals(args.where).map((goal) => ({ ...goal }));
    },
    create: async (args: Prisma.GoalCreateArgs): Promise<Goal> => {
      const data = args.data as Prisma.GoalUncheckedCreateInput;
      const now = new Date();
      const goal: Goal = {
        id: data.id || this.nextId("goal"),
        userId: data.userId,
        name: data.name,
        targetAmountMinor: data.targetAmountMinor,
        currentAmountMinor: data.currentAmountMinor ?? 0,
        currency: data.currency ?? CurrencyCode.EUR,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status ?? GoalStatus.ACTIVE,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      };

      this.goals.push(goal);
      return { ...goal };
    },
    findFirst: async (args: Prisma.GoalFindFirstArgs): Promise<Goal | null> => {
      const goal = this.filterGoals(args.where)[0] ?? null;
      return goal ? { ...goal } : null;
    },
    update: async (args: Prisma.GoalUpdateArgs): Promise<Goal> => {
      const goal = this.goals.find(
        (candidate) => candidate.id === args.where.id,
      );

      if (!goal) {
        throw new Error("Goal not found");
      }

      const data = args.data as Prisma.GoalUncheckedUpdateInput;
      Object.assign(goal, {
        ...data,
        targetDate: data.targetDate
          ? new Date(data.targetDate as Date)
          : goal.targetDate,
        updatedAt: new Date(),
      });

      return { ...goal };
    },
    deleteMany: async (
      args: Prisma.GoalDeleteManyArgs,
    ): Promise<Prisma.BatchPayload> => {
      const before = this.goals.length;
      this.goals = this.goals.filter(
        (goal) =>
          goal.id !== args.where?.id || goal.userId !== args.where?.userId,
      );

      return { count: before - this.goals.length };
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

  private filterBudgets(where: Prisma.BudgetWhereInput | undefined): Budget[] {
    return this.budgets.filter((budget) => {
      if (where?.id && budget.id !== where.id) {
        return false;
      }

      if (where?.userId && budget.userId !== where.userId) {
        return false;
      }

      if (where?.category && budget.category !== where.category) {
        return false;
      }

      if (where?.monthKey && budget.monthKey !== where.monthKey) {
        return false;
      }

      return true;
    });
  }

  private filterGoals(where: Prisma.GoalWhereInput | undefined): Goal[] {
    return this.goals.filter((goal) => {
      if (where?.id && goal.id !== where.id) {
        return false;
      }

      if (where?.userId && goal.userId !== where.userId) {
        return false;
      }

      return true;
    });
  }

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }
}

describe("Budgets and Goals API (e2e)", () => {
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

  it("requires authentication for budget and goal listings", async () => {
    const server = app.getHttpServer();

    await request(server).get("/api/budgets").expect(401);
    await request(server).get("/api/goals").expect(401);
  });

  it("creates, lists, updates, and deletes the current user's budgets", async () => {
    const agent = request.agent(app.getHttpServer());
    await register(agent, "budget-owner@example.com");

    const createResponse = await agent
      .post("/api/budgets")
      .send({
        category: "travel",
        limitAmountMinor: 40000,
        currency: "EUR",
        monthKey: "2026-08",
      })
      .expect(201);

    const budgetId = createResponse.body.data.budget.id as string;
    expect(createResponse.body.data.budget).toMatchObject({
      category: "travel",
      limitAmountMinor: 40000,
      monthKey: "2026-08",
    });

    const duplicateResponse = await agent
      .post("/api/budgets")
      .send({
        category: "travel",
        limitAmountMinor: 45000,
        currency: "EUR",
        monthKey: "2026-08",
      })
      .expect(409);

    expect(duplicateResponse.body.error.code).toBe("CONFLICT");

    const listResponse = await agent
      .get("/api/budgets?monthKey=2026-08")
      .expect(200);
    expect(listResponse.body.data.budgets).toHaveLength(1);

    const updateResponse = await agent
      .patch(`/api/budgets/${budgetId}`)
      .send({ limitAmountMinor: 50000 })
      .expect(200);
    expect(updateResponse.body.data.budget.limitAmountMinor).toBe(50000);

    await agent.delete(`/api/budgets/${budgetId}`).expect(200);

    const emptyList = await agent
      .get("/api/budgets?monthKey=2026-08")
      .expect(200);
    expect(emptyList.body.data.budgets).toEqual([]);
  });

  it("does not expose another user's budgets or goals", async () => {
    const owner = request.agent(app.getHttpServer());
    const other = request.agent(app.getHttpServer());
    await register(owner, "owner@example.com");
    await register(other, "other@example.com");

    const budgetResponse = await owner
      .post("/api/budgets")
      .send({
        category: "groceries",
        limitAmountMinor: 35000,
        currency: "EUR",
        monthKey: "2026-08",
      })
      .expect(201);
    const budgetId = budgetResponse.body.data.budget.id as string;

    const goalResponse = await owner
      .post("/api/goals")
      .send({
        name: "Emergency fund",
        targetAmountMinor: 300000,
        currentAmountMinor: 50000,
        currency: "EUR",
        targetDate: "2026-12-31",
      })
      .expect(201);
    const goalId = goalResponse.body.data.goal.id as string;

    expect((await other.get("/api/budgets").expect(200)).body.data.budgets).toEqual([]);
    expect((await other.get("/api/goals").expect(200)).body.data.goals).toEqual([]);
    await other.get(`/api/budgets/${budgetId}`).expect(404);
    await other.patch(`/api/budgets/${budgetId}`).send({ limitAmountMinor: 1 }).expect(404);
    await other.delete(`/api/budgets/${budgetId}`).expect(404);
    await other.get(`/api/goals/${goalId}`).expect(404);
    await other.patch(`/api/goals/${goalId}`).send({ currentAmountMinor: 1 }).expect(404);
    await other.delete(`/api/goals/${goalId}`).expect(404);
  });

  it("creates, lists, updates, and deletes the current user's goals", async () => {
    const agent = request.agent(app.getHttpServer());
    await register(agent, "goal-owner@example.com");

    const createResponse = await agent
      .post("/api/goals")
      .send({
        name: "Emergency fund",
        targetAmountMinor: 300000,
        currentAmountMinor: 50000,
        currency: "EUR",
        targetDate: "2026-12-31",
      })
      .expect(201);

    const goalId = createResponse.body.data.goal.id as string;
    expect(createResponse.body.data.goal).toMatchObject({
      name: "Emergency fund",
      targetAmountMinor: 300000,
      currentAmountMinor: 50000,
      status: "active",
    });

    const listResponse = await agent.get("/api/goals").expect(200);
    expect(listResponse.body.data.goals).toHaveLength(1);

    const updateResponse = await agent
      .patch(`/api/goals/${goalId}`)
      .send({ currentAmountMinor: 300000 })
      .expect(200);
    expect(updateResponse.body.data.goal).toMatchObject({
      currentAmountMinor: 300000,
      status: "completed",
    });

    await agent
      .patch(`/api/goals/${goalId}`)
      .send({ currentAmountMinor: 300001 })
      .expect(400);

    await agent.delete(`/api/goals/${goalId}`).expect(200);

    const emptyList = await agent.get("/api/goals").expect(200);
    expect(emptyList.body.data.goals).toEqual([]);
  });
});

async function register(
  agent: ReturnType<typeof request.agent>,
  email: string,
): Promise<void> {
  await agent
    .post("/api/auth/register")
    .send({
      email,
      password: "password123",
      name: "Planning User",
    })
    .expect(201);
}
