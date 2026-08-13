import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private get hasDatabaseConfiguration(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  async onModuleInit(): Promise<void> {
    if (this.hasDatabaseConfiguration) {
      await this.$connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.hasDatabaseConfiguration) {
      await this.$disconnect();
    }
  }
}
