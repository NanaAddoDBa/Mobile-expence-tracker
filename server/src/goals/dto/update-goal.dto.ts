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

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetAmountMinor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentAmountMinor?: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency?: CurrencyCode;

  @IsOptional()
  @IsDateString({ strict: true })
  targetDate?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}
