import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConnectedAccountsService } from "./connected-accounts.service";

@Injectable()
export class BankSyncScheduler {
  private readonly logger = new Logger(BankSyncScheduler.name);
  private running = false;

  constructor(
    private readonly connectedAccountsService: ConnectedAccountsService,
  ) {}

  @Cron("0 */15 * * * *")
  async syncDueAccounts(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.connectedAccountsService.syncDueConnections();
    } catch (error) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : "Scheduled bank sync could not be completed",
      );
    } finally {
      this.running = false;
    }
  }
}
