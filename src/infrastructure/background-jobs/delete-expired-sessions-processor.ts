import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { DeleteExpiredSessionsCommand } from "@/application/auth/use-cases/delete-expired-sessions.js";
import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";

export class DeleteExpiredSessionsProcessor extends CronProcessor {
  constructor(
    private readonly logger: ILogger,
    private readonly useCase: ICommandHandler<DeleteExpiredSessionsCommand>,
  ) {
    super("*/10 * * * * *");
  }

  protected async execute(): Promise<void> {
    await this.useCase.handle(new DeleteExpiredSessionsCommand()).orTee((error) => {
      this.logger.error(
        "[DeleteExpiredSessionsProcessor] Failed to delete expired sessions",
        error,
      );
    });
  }
}
