import { IsEnum, IsOptional, Matches } from "class-validator";
import { BudgetPeriod } from "../../common/validation/enums.dto";

export class ListBudgetsQueryDto {
  @IsOptional()
  @IsEnum(BudgetPeriod)
  period?: BudgetPeriod;

  @IsOptional()
  @Matches(/^(?:\d{4}|\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])|\d{4}-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)$/)
  periodKey?: string;
}
