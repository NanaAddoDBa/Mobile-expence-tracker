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

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  source!: string;

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

  @IsEnum(IncomeCategory)
  category!: IncomeCategory;

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

  @ValidateIf((input: CreateIncomeDto) => input.recurringFrequency !== undefined)
  @IsEnum(RecurringFrequency)
  recurringFrequency?: RecurringFrequency;
}
