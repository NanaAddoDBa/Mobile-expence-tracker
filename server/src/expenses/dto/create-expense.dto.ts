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

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  merchant!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsEnum(CurrencyCode)
  @Equals(CurrencyCode.EUR)
  currency: CurrencyCode = CurrencyCode.EUR;

  @IsDateString({ strict: true })
  date!: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

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

  @ValidateIf((input: CreateExpenseDto) => input.recurringFrequency !== undefined)
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency;
}
