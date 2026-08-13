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

export class CreateBudgetDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsInt()
  @Min(1)
  limitAmountMinor!: number;

  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency: CurrencyCode = CurrencyCode.EUR;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  monthKey?: string;
}
