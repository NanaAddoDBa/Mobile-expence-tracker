import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ExpenseCategory as PrismaExpenseCategory,
  Prisma,
} from "@prisma/client";
import { PaginationMeta } from "../common/responses/pagination-response";
import { ExpenseCategory } from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ListExpensesQueryDto } from "./dto/list-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import {
  ExpenseResponse,
  parseDateOnly,
  toExpenseCreateInput,
  toExpenseResponse,
  toExpenseUpdateInput,
} from "./expense.mapper";

export interface ListExpensesResult {
  expenses: ExpenseResponse[];
  pagination: PaginationMeta;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListExpensesQueryDto,
  ): Promise<ListExpensesResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.createListWhere(userId, query);
    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      expenses: expenses.map(toExpenseResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async create(
    userId: string,
    input: CreateExpenseDto,
  ): Promise<ExpenseResponse> {
    const expense = await this.prisma.expense.create({
      data: toExpenseCreateInput(userId, input),
    });

    return toExpenseResponse(expense);
  }

  async getById(userId: string, id: string): Promise<ExpenseResponse> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException("Expense not found");
    }

    return toExpenseResponse(expense);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateExpenseDto,
  ): Promise<ExpenseResponse> {
    await this.ensureOwnsExpense(userId, id);

    const expense = await this.prisma.expense.update({
      where: { id },
      data: toExpenseUpdateInput(input),
    });

    return toExpenseResponse(expense);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.prisma.expense.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Expense not found");
    }
  }

  private async ensureOwnsExpense(userId: string, id: string): Promise<void> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!expense) {
      throw new NotFoundException("Expense not found");
    }
  }

  private createListWhere(
    userId: string,
    query: ListExpensesQueryDto,
  ): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (query.category) {
      where.category = this.mapCategory(query.category);
    }

    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: parseDateOnly(query.from) } : {}),
        ...(query.to ? { lte: endOfDateOnly(query.to) } : {}),
      };
    }

    return where;
  }

  private mapCategory(category: ExpenseCategory): PrismaExpenseCategory {
    return category.toUpperCase() as PrismaExpenseCategory;
  }
}

function endOfDateOnly(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}
