import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import {
  CurrencyCode,
  EntrySource,
  IncomeCategory,
  PaymentMethod,
  RecurringFrequency,
} from "../../common/validation/enums.dto";

export class UpdateIncomeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountMinor?: number;

  @IsOptional()
  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency?: CurrencyCode;

  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;

  @IsOptional()
  @IsEnum(IncomeCategory)
  category?: IncomeCategory;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(EntrySource)
  entrySource?: EntrySource;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ValidateIf((input: UpdateIncomeDto) => input.recurringFrequency !== undefined)
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency | null;
}
