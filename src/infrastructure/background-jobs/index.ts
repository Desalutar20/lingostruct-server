import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { DeleteExpiredSessionsCommand } from "@/application/auth/use-cases/delete-expired-sessions.js";
import { DeleteExpiredSessionsProcessor } from "@/infrastructure/background-jobs/delete-expired-sessions-processor.js";
import { DeleteNotVerifiedUsersProcessor } from "@/infrastructure/background-jobs/delete-not-verified-users-processor.js";
import { OutboxEmailProcessor } from "@/infrastructure/background-jobs/outbox-email-processor.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";

export class BackgroundJobs {
  private readonly outboxEmailProcessor: OutboxEmailProcessor;
  private readonly deleteNotVerifiedUsersProcessor: DeleteNotVerifiedUsersProcessor;
  private readonly deleteExpiredSessionsProcessor: DeleteExpiredSessionsProcessor;

  constructor(
    unitOfWork: IUnitOfWork,
    emailSender: IEmailSender,
    logger: ILogger,
    emailTemplateRenderer: EmailTemplateRenderer,
    deleteExpiredUsersUseCase: ICommandHandler<DeleteExpiredSessionsCommand>,
  ) {
    this.outboxEmailProcessor = new OutboxEmailProcessor(
      unitOfWork,
      emailSender,
      logger,
      emailTemplateRenderer,
    );
    this.deleteNotVerifiedUsersProcessor = new DeleteNotVerifiedUsersProcessor(unitOfWork, logger);
    this.deleteExpiredSessionsProcessor = new DeleteExpiredSessionsProcessor(
      logger,
      deleteExpiredUsersUseCase,
    );
  }

  start() {
    this.outboxEmailProcessor.start();
    this.deleteNotVerifiedUsersProcessor.start();
    this.deleteExpiredSessionsProcessor.start();
  }

  stop() {
    this.outboxEmailProcessor.stop();
    this.deleteNotVerifiedUsersProcessor.stop();
    this.deleteExpiredSessionsProcessor.stop();
  }
}
