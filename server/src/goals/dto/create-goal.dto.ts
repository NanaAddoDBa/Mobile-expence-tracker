import {
  Equals,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import {
  CurrencyCode,
  GoalStatus,
} from "../../common/validation/enums.dto";

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(1)
  targetAmountMinor!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentAmountMinor?: number;

  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency: CurrencyCode = CurrencyCode.EUR;

  @IsDateString({ strict: true })
  targetDate!: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
