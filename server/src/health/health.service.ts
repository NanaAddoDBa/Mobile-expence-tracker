import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface HealthResponse {
  status: "ok";
  service: "expense-tracker-api";
  timestamp: string;
}

export interface ReadinessResponse extends HealthResponse {
  checks: {
    database: "ok";
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "expense-tracker-api",
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException("Database is not ready");
    }

    return {
      ...this.getHealth(),
      checks: { database: "ok" },
    };
  }
}
