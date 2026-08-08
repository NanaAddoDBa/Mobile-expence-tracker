import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { IdParamDto } from "../common/dto/id-param.dto";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import {
  ConnectedAccountsService,
  ImportTransactionsResult,
} from "./connected-accounts.service";
import { ConnectedAccountResponse } from "./connected-account.mapper";
import { StartBankConnectionDto } from "./dto/start-bank-connection.dto";
import { GoCardlessInstitution } from "./providers/gocardless-bank-data.client";

interface ConnectedAccountsPayload {
  accounts: ConnectedAccountResponse[];
}

interface ConnectedAccountPayload {
  account: ConnectedAccountResponse;
}

interface InstitutionsPayload {
  institutions: GoCardlessInstitution[];
}

interface BankConnectionStartPayload {
  connection: ConnectedAccountResponse;
  linkUrl: string;
}

interface ImportTransactionsPayload {
  result: ImportTransactionsResult;
}

interface DeletePayload {
  success: true;
}

@Controller("connected-accounts")
@UseGuards(AuthGuard)
export class ConnectedAccountsController {
  constructor(
    private readonly connectedAccountsService: ConnectedAccountsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<ConnectedAccountsPayload>> {
    const accounts = await this.connectedAccountsService.list(
      this.getUserId(request),
    );

    return createApiSuccess({ accounts });
  }

  @Get("institutions")
  async listInstitutions(
    @Query("country") country = "DE",
  ): Promise<ApiSuccessResponse<InstitutionsPayload>> {
    const institutions = await this.connectedAccountsService.listInstitutions(
      country,
    );

    return createApiSuccess({ institutions });
  }

  @Post("link/start")
  async startBankConnection(
    @Req() request: AuthenticatedRequest,
    @Body() input: StartBankConnectionDto,
  ): Promise<ApiSuccessResponse<BankConnectionStartPayload>> {
    const result = await this.connectedAccountsService.startBankConnection(
      this.getUserId(request),
      input,
    );

    return createApiSuccess({
      connection: result.connection,
      linkUrl: result.linkUrl,
    });
  }

  @Get("link/callback")
  async completeBankConnection(
    @Req() request: AuthenticatedRequest,
    @Query("connectionId") connectionId: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.connectedAccountsService.completeBankConnection(
      this.getUserId(request),
      connectionId,
    );

    const frontendOrigin =
      this.config.get<string>("FRONTEND_ORIGIN") || "http://localhost:5173";
    response.redirect(`${frontendOrigin}/?bankConnection=completed`);
  }

  @Post(":id/import")
  async importTransactions(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<ImportTransactionsPayload>> {
    const result = await this.connectedAccountsService.importTransactions(
      this.getUserId(request),
      params.id,
    );

    return createApiSuccess({ result });
  }

  @Get(":id")
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<ConnectedAccountPayload>> {
    const accounts = await this.connectedAccountsService.list(
      this.getUserId(request),
    );
    const account = accounts.find((item) => item.id === params.id);

    if (!account) {
      throw new NotFoundException("Connected account not found");
    }

    return createApiSuccess({ account });
  }

  @Delete(":id")
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: IdParamDto,
  ): Promise<ApiSuccessResponse<DeletePayload>> {
    await this.connectedAccountsService.remove(this.getUserId(request), params.id);

    return createApiSuccess({ success: true });
  }

  private getUserId(request: AuthenticatedRequest): string {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    return request.user.id;
  }
}
