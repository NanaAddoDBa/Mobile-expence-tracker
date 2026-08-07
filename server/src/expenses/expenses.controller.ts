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
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { ListExpensesQueryDto } from "./dto/list-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseResponse } from "./expense.mapper";
import { ExpensesService } from "./expenses.service";

interface ExpensePayload {
  expense: ExpenseResponse;
}

interface ExpensesPayload {
  expenses: ExpenseResponse[];
}

interface DeletePayload {
  success: true;
}

@Controller("expenses")
@UseGuards(AuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListExpensesQueryDto,
  ): Promise<ApiSuccessResponse<ExpensesPayload>> {
    const userId = this.getUserId(request);
    const result = await this.expensesService.list(userId, query);

    return createApiSuccess(
      { expenses: result.expenses },
      { pagination: result.pagination satisfies PaginationMeta },
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateExpenseDto,
  ): Promise<ApiSuccessResponse<ExpensePayload>> {
    const expense = await this.expensesService.create(
      this.getUserId(request),
      input,
    );

    return createApiSuccess({ expense });
  }

  @Get(":id")
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<ExpensePayload>> {
    const expense = await this.expensesService.getById(
      this.getUserId(request),
      params.id,
    );

    return createApiSuccess({ expense });
  }

  @Patch(":id")
  async update(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
    @Body() input: UpdateExpenseDto,
  ): Promise<ApiSuccessResponse<ExpensePayload>> {
    const expense = await this.expensesService.update(
      this.getUserId(request),
      params.id,
      input,
    );

    return createApiSuccess({ expense });
  }

  @Delete(":id")
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<DeletePayload>> {
    await this.expensesService.delete(this.getUserId(request), params.id);

    return createApiSuccess({ success: true });
  }

  private getUserId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    return request.user.id;
  }
}
