import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { DeleteNotVerifiedUsersProcessor } from "@/infrastructure/background-jobs/delete-not-verified-users-processor.js";
import { OutboxEmailProcessor } from "@/infrastructure/background-jobs/outbox-email-processor.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";

export class BackgroundJobs {
  private readonly outboxEmailProcessor: OutboxEmailProcessor;
  private readonly DeleteNotVerifiedUsersProcessor: DeleteNotVerifiedUsersProcessor;

  constructor(
    unitOfWork: IUnitOfWork,
    emailSender: IEmailSender,
    logger: ILogger,
    emailTemplateRenderer: EmailTemplateRenderer,
  ) {
    this.outboxEmailProcessor = new OutboxEmailProcessor(
      unitOfWork,
      emailSender,
      logger,
      emailTemplateRenderer,
    );
    this.DeleteNotVerifiedUsersProcessor = new DeleteNotVerifiedUsersProcessor(unitOfWork);
  }

  start() {
    this.outboxEmailProcessor.start();
    this.DeleteNotVerifiedUsersProcessor.start();
  }

  stop() {
    this.outboxEmailProcessor.stop();
    this.DeleteNotVerifiedUsersProcessor.stop();
  }
}
