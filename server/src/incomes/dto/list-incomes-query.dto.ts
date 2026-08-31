import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { IncomeCategory } from "../../common/validation/enums.dto";

export class ListIncomesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(IncomeCategory)
  category?: IncomeCategory;

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
