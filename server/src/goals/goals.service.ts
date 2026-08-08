import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Goal } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import {
  GoalResponse,
  toGoalCreateInput,
  toGoalResponse,
  toGoalUpdateInput,
} from "./goal.mapper";

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<GoalResponse[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
    });

    return goals.map(toGoalResponse);
  }

  async create(userId: string, input: CreateGoalDto): Promise<GoalResponse> {
    this.assertValidProgress(
      input.targetAmountMinor,
      input.currentAmountMinor ?? 0,
    );

    const goal = await this.prisma.goal.create({
      data: toGoalCreateInput(userId, input),
    });

    return toGoalResponse(goal);
  }

  async getById(userId: string, id: string): Promise<GoalResponse> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    return toGoalResponse(goal);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateGoalDto,
  ): Promise<GoalResponse> {
    const existingGoal = await this.findOwnedGoal(userId, id);
    const nextAmounts = {
      targetAmountMinor:
        input.targetAmountMinor ?? existingGoal.targetAmountMinor,
      currentAmountMinor:
        input.currentAmountMinor ?? existingGoal.currentAmountMinor,
    };
    this.assertValidProgress(
      nextAmounts.targetAmountMinor,
      nextAmounts.currentAmountMinor,
    );

    const goal = await this.prisma.goal.update({
      where: { id },
      data: toGoalUpdateInput(input, nextAmounts),
    });

    return toGoalResponse(goal);
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await this.prisma.goal.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Goal not found");
    }
  }

  private async findOwnedGoal(userId: string, id: string): Promise<Goal> {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException("Goal not found");
    }

    return goal;
  }

  private assertValidProgress(
    targetAmountMinor: number,
    currentAmountMinor: number,
  ): void {
    if (currentAmountMinor > targetAmountMinor) {
      throw new BadRequestException(
        "Current amount cannot exceed target amount",
      );
    }
  }
}
