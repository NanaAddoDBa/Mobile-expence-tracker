import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { PrismaService } from "../prisma/prisma.service";

describe("HealthController", () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn().mockResolvedValue([{ value: 1 }]) },
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  it("returns health status", () => {
    expect(healthController.getHealth()).toMatchObject({
      status: "ok",
      service: "expense-tracker-api",
    });
    expect(new Date(healthController.getHealth().timestamp).toString()).not.toBe("Invalid Date");
  });

  it("returns database readiness only after the database responds", async () => {
    await expect(healthController.getReadiness()).resolves.toMatchObject({
      status: "ok",
      checks: { database: "ok" },
    });
  });
});
