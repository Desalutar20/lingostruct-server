import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { DeleteExpiredSessionsProcessor } from "@/infrastructure/background-jobs/delete-expired-sessions-processor.js";
import { DeleteNotVerifiedUsersProcessor } from "@/infrastructure/background-jobs/delete-not-verified-users-processor.js";
import { OutboxEmailProcessor } from "@/infrastructure/background-jobs/outbox-email-processor.js";
import { OutboxUserBannedProcessor } from "@/infrastructure/background-jobs/outbox-user-banned-processor.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";

export class BackgroundJobs {
  private readonly outboxEmailProcessor: OutboxEmailProcessor;
  private readonly outboxUserBanStatusChangedProcessor: OutboxUserBannedProcessor;
  private readonly deleteNotVerifiedUsersProcessor: DeleteNotVerifiedUsersProcessor;
  private readonly deleteExpiredSessionsProcessor: DeleteExpiredSessionsProcessor;

  constructor(
    unitOfWork: IUnitOfWork,
    emailSender: IEmailSender,
    emailTemplateRenderer: EmailTemplateRenderer,
    sessionStore: ISessionStore,
    logger: ILogger,
  ) {
    this.outboxEmailProcessor = new OutboxEmailProcessor(
      unitOfWork,
      emailSender,
      logger,
      emailTemplateRenderer,
    );
    this.outboxUserBanStatusChangedProcessor = new OutboxUserBannedProcessor(
      unitOfWork,
      sessionStore,
      logger,
    );
    this.deleteNotVerifiedUsersProcessor = new DeleteNotVerifiedUsersProcessor(unitOfWork, logger);
    this.deleteExpiredSessionsProcessor = new DeleteExpiredSessionsProcessor(
      sessionStore,

      logger,
    );
  }

  start() {
    this.outboxEmailProcessor.start();
    this.outboxUserBanStatusChangedProcessor.start();
    this.deleteNotVerifiedUsersProcessor.start();
    this.deleteExpiredSessionsProcessor.start();
  }

  stop() {
    this.outboxEmailProcessor.stop();
    this.outboxUserBanStatusChangedProcessor.stop();
    this.deleteNotVerifiedUsersProcessor.stop();
    this.deleteExpiredSessionsProcessor.stop();
  }
}
