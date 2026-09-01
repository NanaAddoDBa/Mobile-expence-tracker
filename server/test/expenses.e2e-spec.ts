import {
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import {
  CurrencyCode,
  EntrySource,
  Expense,
  Prisma,
  Session,
  User,
  UserStatus,
} from "@prisma/client";
import { Test, TestingModule } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AccountRecoveryService } from "../src/auth/account-recovery.service";
import { HttpExceptionFilter } from "../src/common/errors/http-exception.filter";
import { CsrfService } from "../src/common/security/csrf.service";
import { PrismaService } from "../src/prisma/prisma.service";

class InMemoryPrisma {
  private users: User[] = [];
  private sessions: Session[] = [];
  private expenses: Expense[] = [];
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

  readonly expense = {
    findMany: async (args: Prisma.ExpenseFindManyArgs): Promise<Expense[]> => {
      const filtered = this.filterExpenses(args.where);

      return filtered
        .sort(
          (a, b) =>
            b.date.getTime() - a.date.getTime() ||
            b.createdAt.getTime() - a.createdAt.getTime(),
        )
        .slice(args.skip ?? 0, (args.skip ?? 0) + (args.take ?? filtered.length))
        .map((expense) => ({ ...expense }));
    },
    count: async (args: Prisma.ExpenseCountArgs): Promise<number> => {
      return this.filterExpenses(args.where).length;
    },
    create: async (args: Prisma.ExpenseCreateArgs): Promise<Expense> => {
      const data = args.data as Prisma.ExpenseUncheckedCreateInput;
      const now = new Date();
      const expense: Expense = {
        id: data.id || this.nextId("expense"),
        userId: data.userId,
        merchant: data.merchant,
        description: data.description ?? null,
        amountMinor: data.amountMinor,
        currency: data.currency ?? CurrencyCode.EUR,
        date: new Date(data.date),
        category: data.category,
        paymentMethod: data.paymentMethod,
        entrySource: data.entrySource ?? EntrySource.MANUAL,
        notes: data.notes ?? null,
        receiptId: data.receiptId ?? null,
        sourceAccountId: data.sourceAccountId ?? null,
        importBatchId: data.importBatchId ?? null,
        externalTransactionId: data.externalTransactionId ?? null,
        isRecurring: data.isRecurring ?? false,
        recurringFrequency: data.recurringFrequency ?? null,
        recurringTemplateId: data.recurringTemplateId ?? null,
        createdAt: data.createdAt ? new Date(data.createdAt) : now,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
      };

      this.expenses.push(expense);
      return { ...expense };
    },
    findFirst: async (
      args: Prisma.ExpenseFindFirstArgs,
    ): Promise<Expense | { id: string } | null> => {
      const expense = this.filterExpenses(args.where)[0] ?? null;

      if (!expense) {
        return null;
      }

      if (args.select?.id) {
        return { id: expense.id };
      }

      return { ...expense };
    },
    update: async (args: Prisma.ExpenseUpdateArgs): Promise<Expense> => {
      const expense = this.expenses.find(
        (candidate) => candidate.id === args.where.id,
      );

      if (!expense) {
        throw new Error("Expense not found");
      }

      const data = args.data as Prisma.ExpenseUncheckedUpdateInput;
      Object.assign(expense, {
        ...data,
        date: data.date ? new Date(data.date as Date) : expense.date,
        updatedAt: new Date(),
      });

      return { ...expense };
    },
    deleteMany: async (
      args: Prisma.ExpenseDeleteManyArgs,
    ): Promise<Prisma.BatchPayload> => {
      const before = this.expenses.length;
      this.expenses = this.expenses.filter(
        (expense) =>
          expense.id !== args.where?.id || expense.userId !== args.where?.userId,
      );

      return { count: before - this.expenses.length };
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

  private filterExpenses(where: Prisma.ExpenseWhereInput | undefined): Expense[] {
    return this.expenses.filter((expense) => {
      if (where?.id && expense.id !== where.id) {
        return false;
      }

      if (where?.userId && expense.userId !== where.userId) {
        return false;
      }

      if (where?.category && expense.category !== where.category) {
        return false;
      }

      const dateFilter = where?.date;
      if (
        dateFilter &&
        typeof dateFilter === "object" &&
        "gte" in dateFilter &&
        dateFilter.gte instanceof Date &&
        expense.date < dateFilter.gte
      ) {
        return false;
      }

      if (
        dateFilter &&
        typeof dateFilter === "object" &&
        "lte" in dateFilter &&
        dateFilter.lte instanceof Date &&
        expense.date > dateFilter.lte
      ) {
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

describe("Expenses API (e2e)", () => {
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
      .overrideProvider(CsrfService)
      .useValue({
        generateToken: () => "test-csrf-token",
        validateRequest: () => true,
      })
      .overrideProvider(AccountRecoveryService)
      .useValue({ requestEmailVerification: async () => false })
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

  it("requires authentication for expense listing", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/expenses")
      .expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates, lists, updates, and deletes the current user's expenses", async () => {
    const agent = request.agent(app.getHttpServer());
    await register(agent, "owner@example.com");

    const createResponse = await agent
      .post("/api/expenses")
      .send({
        merchant: "Corner Market",
        description: "Weekly groceries",
        amountMinor: 2475,
        currency: "EUR",
        date: "2026-06-02",
        category: "groceries",
        paymentMethod: "debit_card",
        isRecurring: true,
        recurringFrequency: "weekly",
      })
      .expect(201);

    const expenseId = createResponse.body.data.expense.id as string;
    expect(createResponse.body.data.expense).toMatchObject({
      merchant: "Corner Market",
      amountMinor: 2475,
      category: "groceries",
      isRecurring: true,
      recurringFrequency: "weekly",
    });

    const listResponse = await agent.get("/api/expenses").expect(200);
    expect(listResponse.body.data.expenses).toHaveLength(1);
    expect(listResponse.body.meta.pagination.total).toBe(1);

    const updateResponse = await agent
      .patch(`/api/expenses/${expenseId}`)
      .send({
        merchant: "Updated Market",
        amountMinor: 3000,
        isRecurring: false,
      })
      .expect(200);

    expect(updateResponse.body.data.expense).toMatchObject({
      merchant: "Updated Market",
      amountMinor: 3000,
      isRecurring: false,
      recurringFrequency: null,
    });

    await agent.delete(`/api/expenses/${expenseId}`).expect(200);

    const emptyList = await agent.get("/api/expenses").expect(200);
    expect(emptyList.body.data.expenses).toEqual([]);
  });

  it("does not expose another user's expenses", async () => {
    const owner = request.agent(app.getHttpServer());
    const other = request.agent(app.getHttpServer());
    await register(owner, "owner@example.com");
    await register(other, "other@example.com");

    const createResponse = await owner
      .post("/api/expenses")
      .send({
        merchant: "Private Market",
        amountMinor: 1500,
        currency: "EUR",
        date: "2026-06-03",
        category: "shopping",
        paymentMethod: "cash",
      })
      .expect(201);
    const expenseId = createResponse.body.data.expense.id as string;

    const otherList = await other.get("/api/expenses").expect(200);
    expect(otherList.body.data.expenses).toEqual([]);

    await other.get(`/api/expenses/${expenseId}`).expect(404);
    await other.patch(`/api/expenses/${expenseId}`).send({ amountMinor: 1 }).expect(404);
    await other.delete(`/api/expenses/${expenseId}`).expect(404);
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
      name: "Expense User",
    })
    .expect(201);
}
