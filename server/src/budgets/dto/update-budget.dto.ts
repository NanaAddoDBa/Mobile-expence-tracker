import {
  Equals,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from "class-validator";
import {
  CurrencyCode,
  ExpenseCategory,
} from "../../common/validation/enums.dto";

export class UpdateBudgetDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitAmountMinor?: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency?: CurrencyCode;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  monthKey?: string;
}
