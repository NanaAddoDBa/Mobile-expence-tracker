import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import { CashFlowService, CashFlowSummary } from "./cash-flow.service";
import { CashFlowQueryDto } from "./dto/cash-flow-query.dto";

interface CashFlowSummaryPayload {
  summary: CashFlowSummary;
}

@Controller("cash-flow")
@UseGuards(AuthGuard)
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get("summary")
  async getSummary(
    @Req() request: AuthenticatedRequest,
    @Query() query: CashFlowQueryDto,
  ): Promise<ApiSuccessResponse<CashFlowSummaryPayload>> {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const summary = await this.cashFlowService.getSummary(request.user.id, query);
    return createApiSuccess({ summary });
  }
}
