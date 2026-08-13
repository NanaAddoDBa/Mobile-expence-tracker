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
import { BudgetResponse } from "./budget.mapper";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { ListBudgetsQueryDto } from "./dto/list-budgets-query.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

interface BudgetPayload {
  budget: BudgetResponse;
}

interface BudgetsPayload {
  budgets: BudgetResponse[];
}

interface DeletePayload {
  success: true;
}

@Controller("budgets")
@UseGuards(AuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListBudgetsQueryDto,
  ): Promise<ApiSuccessResponse<BudgetsPayload>> {
    const budgets = await this.budgetsService.list(
      this.getUserId(request),
      query,
    );

    return createApiSuccess({ budgets });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBudgetDto,
  ): Promise<ApiSuccessResponse<BudgetPayload>> {
    const budget = await this.budgetsService.create(
      this.getUserId(request),
      input,
    );

    return createApiSuccess({ budget });
  }

  @Get(":id")
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<BudgetPayload>> {
    const budget = await this.budgetsService.getById(
      this.getUserId(request),
      params.id,
    );

    return createApiSuccess({ budget });
  }

  @Patch(":id")
  async update(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
    @Body() input: UpdateBudgetDto,
  ): Promise<ApiSuccessResponse<BudgetPayload>> {
    const budget = await this.budgetsService.update(
      this.getUserId(request),
      params.id,
      input,
    );

    return createApiSuccess({ budget });
  }

  @Delete(":id")
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<DeletePayload>> {
    await this.budgetsService.delete(this.getUserId(request), params.id);

    return createApiSuccess({ success: true });
  }

  private getUserId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    return request.user.id;
  }
}
