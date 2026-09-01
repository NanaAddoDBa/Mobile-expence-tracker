import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CurrencyCode as PrismaCurrencyCode,
  IncomeCategory as PrismaIncomeCategory,
  Prisma,
} from "@prisma/client";
import { PaginationMeta } from "../common/responses/pagination-response";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { ListIncomesQueryDto } from "./dto/list-incomes-query.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";
import {
  IncomeResponse,
  parseIncomeDateOnly,
  toIncomeCreateInput,
  toIncomeResponse,
  toIncomeUpdateInput,
} from "./income.mapper";

export interface ListIncomesResult {
  incomes: IncomeResponse[];
  pagination: PaginationMeta;
}

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListIncomesQueryDto): Promise<ListIncomesResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.createListWhere(userId, query);
    const [incomes, total] = await Promise.all([
      this.prisma.income.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.income.count({ where }),
    ]);

    return {
      incomes: incomes.map(toIncomeResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  async create(userId: string, input: CreateIncomeDto): Promise<IncomeResponse> {
    const income = await this.prisma.income.create({
      data: toIncomeCreateInput(userId, input),
    });
    return toIncomeResponse(income);
  }

  async getById(userId: string, id: string): Promise<IncomeResponse> {
    const income = await this.prisma.income.findFirst({ where: { id, userId } });
    if (!income) throw new NotFoundException("Income not found");
    return toIncomeResponse(income);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateIncomeDto,
  ): Promise<IncomeResponse> {
    await this.ensureOwnsIncome(userId, id);
    const income = await this.prisma.income.update({
      where: { id },
      data: toIncomeUpdateInput(input),
    });
    return toIncomeResponse(income);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.prisma.income.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new NotFoundException("Income not found");
  }

  private async ensureOwnsIncome(userId: string, id: string): Promise<void> {
    const income = await this.prisma.income.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!income) throw new NotFoundException("Income not found");
  }

  private createListWhere(
    userId: string,
    query: ListIncomesQueryDto,
  ): Prisma.IncomeWhereInput {
    const where: Prisma.IncomeWhereInput = {
      userId,
      currency: PrismaCurrencyCode.EUR,
    };
    if (query.category) {
      where.category = query.category.toUpperCase() as PrismaIncomeCategory;
    }
    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: parseIncomeDateOnly(query.from) } : {}),
        ...(query.to ? { lte: endOfDateOnly(query.to) } : {}),
      };
    }
    return where;
  }
}

function endOfDateOnly(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}
