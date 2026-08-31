import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { IdParamDto } from "../common/dto/id-param.dto";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import { PaginationMeta } from "../common/responses/pagination-response";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { ListIncomesQueryDto } from "./dto/list-incomes-query.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";
import { IncomeResponse } from "./income.mapper";
import { IncomesService } from "./incomes.service";

interface IncomePayload {
  income: IncomeResponse;
}

interface IncomesPayload {
  incomes: IncomeResponse[];
}

@Controller("incomes")
@UseGuards(AuthGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListIncomesQueryDto,
  ): Promise<ApiSuccessResponse<IncomesPayload>> {
    const result = await this.incomesService.list(this.getUserId(request), query);
    return createApiSuccess(
      { incomes: result.incomes },
      { pagination: result.pagination satisfies PaginationMeta },
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateIncomeDto,
  ): Promise<ApiSuccessResponse<IncomePayload>> {
    const income = await this.incomesService.create(this.getUserId(request), input);
    return createApiSuccess({ income });
  }

  @Get(":id")
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<IncomePayload>> {
    const income = await this.incomesService.getById(this.getUserId(request), params.id);
    return createApiSuccess({ income });
  }

  @Patch(":id")
  async update(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
    @Body() input: UpdateIncomeDto,
  ): Promise<ApiSuccessResponse<IncomePayload>> {
    const income = await this.incomesService.update(
      this.getUserId(request),
      params.id,
      input,
    );
    return createApiSuccess({ income });
  }

  @Delete(":id")
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<{ success: true }>> {
    await this.incomesService.delete(this.getUserId(request), params.id);
    return createApiSuccess({ success: true });
  }

  private getUserId(request: AuthenticatedRequest): string {
    if (!request.user) throw new UnauthorizedException("Authentication required");
    return request.user.id;
  }
}
