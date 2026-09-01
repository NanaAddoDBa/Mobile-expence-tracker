import { Type } from "class-transformer";
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { CurrencyCode } from "../../common/validation/enums.dto";

class AccessibilitySettingsDto {
  @IsOptional()
  @IsBoolean()
  largerText?: boolean;

  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsBoolean()
  comfortableLayout?: boolean;
}

class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  enableAlerts?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  budgetThreshold?: number;

  @IsOptional()
  @IsBoolean()
  recurringReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklySummaries?: boolean;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(["light", "dark", "system"])
  theme?: "light" | "dark" | "system";

  @IsOptional()
  @Equals(CurrencyCode.EUR)
  currency?: CurrencyCode;

  @IsOptional()
  @IsString()
  @MaxLength(35)
  @Matches(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
  language?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilitySettingsDto)
  accessibility?: AccessibilitySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;
}
