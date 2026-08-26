import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";

export class DeleteExpiredSessionsProcessor extends CronProcessor {
  constructor(
    private readonly sessionStore: ISessionStore,
    private readonly logger: ILogger,
  ) {
    super("0 * * * *");
  }

  protected async execute(): Promise<void> {
    await this.sessionStore.deleteExpired().orTee((error) => {
      this.logger.error(
        "[DeleteExpiredSessionsProcessor] Failed to delete expired sessions",
        error,
      );
    });
  }
}
