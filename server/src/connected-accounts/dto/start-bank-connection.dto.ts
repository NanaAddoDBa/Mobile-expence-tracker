import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class StartBankConnectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  institutionId?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/)
  country?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/)
  userLanguage?: string;
}
