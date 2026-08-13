import { IsEnum, IsInt } from "class-validator";
import { CurrencyCode } from "./enums.dto";

export class MoneyDto {
  @IsInt()
  amountMinor!: number;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;
}
