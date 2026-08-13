import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateGoalDto } from "./dto/create-goal.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalResponse } from "./goal.mapper";
import { GoalsService } from "./goals.service";

interface GoalPayload {
  goal: GoalResponse;
}

interface GoalsPayload {
  goals: GoalResponse[];
}

interface DeletePayload {
  success: true;
}

@Controller("goals")
@UseGuards(AuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<GoalsPayload>> {
    const goals = await this.goalsService.list(this.getUserId(request));

    return createApiSuccess({ goals });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateGoalDto,
  ): Promise<ApiSuccessResponse<GoalPayload>> {
    const goal = await this.goalsService.create(this.getUserId(request), input);

    return createApiSuccess({ goal });
  }

  @Get(":id")
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<GoalPayload>> {
    const goal = await this.goalsService.getById(
      this.getUserId(request),
      params.id,
    );

    return createApiSuccess({ goal });
  }

  @Patch(":id")
  async update(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
    @Body() input: UpdateGoalDto,
  ): Promise<ApiSuccessResponse<GoalPayload>> {
    const goal = await this.goalsService.update(
      this.getUserId(request),
      params.id,
      input,
    );

    return createApiSuccess({ goal });
  }

  @Delete(":id")
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<DeletePayload>> {
    await this.goalsService.delete(this.getUserId(request), params.id);

    return createApiSuccess({ success: true });
  }

  private getUserId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    return request.user.id;
  }
}
