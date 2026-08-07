import {
  IsBoolean,
  IsDateString,
  IsEnum,
  Equals,
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
  ExpenseCategory,
  PaymentMethod,
  RecurringFrequency,
} from "../../common/validation/enums.dto";

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  merchant?: string;

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
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

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

  @ValidateIf((input: UpdateExpenseDto) => input.recurringFrequency !== undefined)
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency | null;
}
