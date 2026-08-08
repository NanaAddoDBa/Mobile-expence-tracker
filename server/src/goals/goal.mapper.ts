import {
  CurrencyCode as PrismaCurrencyCode,
  Goal,
  GoalStatus as PrismaGoalStatus,
  Prisma,
} from "@prisma/client";
import {
  CurrencyCode,
  GoalStatus,
} from "../common/validation/enums.dto";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";

export interface GoalResponse {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  currency: CurrencyCode;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const statusToPrisma: Record<GoalStatus, PrismaGoalStatus> = {
  [GoalStatus.ACTIVE]: PrismaGoalStatus.ACTIVE,
  [GoalStatus.COMPLETED]: PrismaGoalStatus.COMPLETED,
  [GoalStatus.PAUSED]: PrismaGoalStatus.PAUSED,
  [GoalStatus.ARCHIVED]: PrismaGoalStatus.ARCHIVED,
};

const statusFromPrisma: Record<PrismaGoalStatus, GoalStatus> = {
  [PrismaGoalStatus.ACTIVE]: GoalStatus.ACTIVE,
  [PrismaGoalStatus.COMPLETED]: GoalStatus.COMPLETED,
  [PrismaGoalStatus.PAUSED]: GoalStatus.PAUSED,
  [PrismaGoalStatus.ARCHIVED]: GoalStatus.ARCHIVED,
};

export function toGoalResponse(goal: Goal): GoalResponse {
  return {
    id: goal.id,
    name: goal.name,
    targetAmountMinor: goal.targetAmountMinor,
    currentAmountMinor: goal.currentAmountMinor,
    currency: goal.currency as CurrencyCode,
    targetDate: goal.targetDate ? goal.targetDate.toISOString().slice(0, 10) : null,
    status: statusFromPrisma[goal.status],
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export function toGoalCreateInput(
  userId: string,
  input: CreateGoalDto,
): Prisma.GoalUncheckedCreateInput {
  const currentAmountMinor = input.currentAmountMinor ?? 0;

  return {
    userId,
    name: input.name.trim(),
    targetAmountMinor: input.targetAmountMinor,
    currentAmountMinor,
    currency: PrismaCurrencyCode.EUR,
    targetDate: parseDateOnly(input.targetDate),
    status: input.status
      ? statusToPrisma[input.status]
      : getProgressStatus(input.targetAmountMinor, currentAmountMinor),
  };
}

export function toGoalUpdateInput(
  input: UpdateGoalDto,
  nextAmounts?: { targetAmountMinor: number; currentAmountMinor: number },
): Prisma.GoalUncheckedUpdateInput {
  const data: Prisma.GoalUncheckedUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
  }

  if (input.targetAmountMinor !== undefined) {
    data.targetAmountMinor = input.targetAmountMinor;
  }

  if (input.currentAmountMinor !== undefined) {
    data.currentAmountMinor = input.currentAmountMinor;
  }

  if (input.currency !== undefined) {
    data.currency = PrismaCurrencyCode.EUR;
  }

  if (input.targetDate !== undefined) {
    data.targetDate = parseDateOnly(input.targetDate);
  }

  if (input.status !== undefined) {
    data.status = statusToPrisma[input.status];
  } else if (nextAmounts) {
    data.status = getProgressStatus(
      nextAmounts.targetAmountMinor,
      nextAmounts.currentAmountMinor,
    );
  }

  return data;
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function getProgressStatus(
  targetAmountMinor: number,
  currentAmountMinor: number,
): PrismaGoalStatus {
  return currentAmountMinor >= targetAmountMinor
    ? PrismaGoalStatus.COMPLETED
    : PrismaGoalStatus.ACTIVE;
}
