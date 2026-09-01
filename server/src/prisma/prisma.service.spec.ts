import { Test, TestingModule } from "@nestjs/testing";
import { PrismaModule } from "./prisma.module";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterAll(() => {
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it("can be resolved without connecting to a database", async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    const prisma = module.get<PrismaService>(PrismaService);

    expect(prisma).toBeDefined();
    expect(prisma.onModuleInit).toEqual(expect.any(Function));
    expect(prisma.onModuleDestroy).toEqual(expect.any(Function));
    delete process.env.DATABASE_URL;
    await expect(prisma.onModuleInit()).resolves.toBeUndefined();
    await module.close();
  });
});
