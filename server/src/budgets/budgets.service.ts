import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Budget,
  ExpenseCategory as PrismaExpenseCategory,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  BudgetResponse,
  toBudgetCreateInput,
  toBudgetResponse,
  toBudgetUpdateInput,
  toPrismaBudgetCategory,
} from "./budget.mapper";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { ListBudgetsQueryDto } from "./dto/list-budgets-query.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListBudgetsQueryDto,
  ): Promise<BudgetResponse[]> {
    const budgets = await this.prisma.budget.findMany({
      where: this.createListWhere(userId, query),
      orderBy: [{ monthKey: "desc" }, { category: "asc" }],
    });

    return budgets.map(toBudgetResponse);
  }

  async create(
    userId: string,
    input: CreateBudgetDto,
  ): Promise<BudgetResponse> {
    const monthKey = input.monthKey ?? getCurrentMonthKey();
    const category = toPrismaBudgetCategory(input.category);
    await this.ensureNoDuplicateBudget(userId, category, monthKey);

    const budget = await this.prisma.budget.create({
      data: toBudgetCreateInput(userId, input, monthKey),
    });

    return toBudgetResponse(budget);
  }

  async getById(userId: string, id: string): Promise<BudgetResponse> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    return toBudgetResponse(budget);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateBudgetDto,
  ): Promise<BudgetResponse> {
    const existingBudget = await this.findOwnedBudget(userId, id);
    const category = input.category
      ? toPrismaBudgetCategory(input.category)
      : existingBudget.category;
    const monthKey = input.monthKey ?? existingBudget.monthKey;

    if (category !== existingBudget.category || monthKey !== existingBudget.monthKey) {
      await this.ensureNoDuplicateBudget(userId, category, monthKey, id);
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: toBudgetUpdateInput(input),
    });

    return toBudgetResponse(budget);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.prisma.budget.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Budget not found");
    }
  }

  private async findOwnedBudget(userId: string, id: string): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      throw new NotFoundException("Budget not found");
    }

    return budget;
  }

  private async ensureNoDuplicateBudget(
    userId: string,
    category: PrismaExpenseCategory,
    monthKey: string,
    exceptId?: string,
  ): Promise<void> {
    const existingBudget = await this.prisma.budget.findFirst({
      where: { userId, category, monthKey },
      select: { id: true },
    });

    if (existingBudget && existingBudget.id !== exceptId) {
      throw new ConflictException(
        "Budget already exists for this category and month",
      );
    }
  }

  private createListWhere(
    userId: string,
    query: ListBudgetsQueryDto,
  ): Prisma.BudgetWhereInput {
    return {
      userId,
      ...(query.monthKey ? { monthKey: query.monthKey } : {}),
    };
  }
}

function getCurrentMonthKey(referenceDate = new Date()): string {
  const month = String(referenceDate.getUTCMonth() + 1).padStart(2, "0");
  return `${referenceDate.getUTCFullYear()}-${month}`;
}
