import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Budget,
  BudgetPeriod as PrismaBudgetPeriod,
  ExpenseCategory as PrismaExpenseCategory,
  Prisma,
} from "@prisma/client";
import { BudgetPeriod } from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import {
  BudgetResponse,
  fromPrismaBudgetPeriod,
  toBudgetCreateInput,
  toBudgetResponse,
  toBudgetUpdateInput,
  toPrismaBudgetCategory,
  toPrismaBudgetPeriod,
} from "./budget.mapper";
import {
  getCurrentBudgetPeriodKey,
  inferBudgetPeriod,
  validateBudgetPeriodKey,
} from "./budget-period";
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
      orderBy: [
        { periodKey: "desc" },
        { period: "asc" },
        { category: "asc" },
      ],
    });

    return budgets.map(toBudgetResponse);
  }

  async create(
    userId: string,
    input: CreateBudgetDto,
  ): Promise<BudgetResponse> {
    const period = input.period ?? BudgetPeriod.MONTHLY;
    const periodKey = input.periodKey ?? getCurrentBudgetPeriodKey(period);
    validateBudgetPeriodKey(period, periodKey);

    const category = toPrismaBudgetCategory(input.category);
    const prismaPeriod = toPrismaBudgetPeriod(period);
    await this.ensureNoDuplicateBudget(
      userId,
      category,
      prismaPeriod,
      periodKey,
    );

    const budget = await this.prisma.budget.create({
      data: toBudgetCreateInput(userId, input, period, periodKey),
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
    const existingPeriod = fromPrismaBudgetPeriod(existingBudget.period);
    const period = input.period ?? existingPeriod;
    const periodKey = input.periodKey ?? (
      period === existingPeriod
        ? existingBudget.periodKey
        : getCurrentBudgetPeriodKey(period)
    );
    validateBudgetPeriodKey(period, periodKey);
    const prismaPeriod = toPrismaBudgetPeriod(period);

    if (
      category !== existingBudget.category ||
      prismaPeriod !== existingBudget.period ||
      periodKey !== existingBudget.periodKey
    ) {
      await this.ensureNoDuplicateBudget(
        userId,
        category,
        prismaPeriod,
        periodKey,
        id,
      );
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: toBudgetUpdateInput(input, period, periodKey),
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
    period: PrismaBudgetPeriod,
    periodKey: string,
    exceptId?: string,
  ): Promise<void> {
    const existingBudget = await this.prisma.budget.findFirst({
      where: { userId, category, period, periodKey },
      select: { id: true },
    });

    if (existingBudget && existingBudget.id !== exceptId) {
      throw new ConflictException(
        "Budget already exists for this category and period",
      );
    }
  }

  private createListWhere(
    userId: string,
    query: ListBudgetsQueryDto,
  ): Prisma.BudgetWhereInput {
    const period = query.period ?? (
      query.periodKey ? inferBudgetPeriod(query.periodKey) : undefined
    );

    if (period && query.periodKey) {
      validateBudgetPeriodKey(period, query.periodKey);
    }

    return {
      userId,
      ...(period ? { period: toPrismaBudgetPeriod(period) } : {}),
      ...(query.periodKey ? { periodKey: query.periodKey } : {}),
    };
  }
}
