import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IEmailSender } from "@/application/abstractions/email/email-sender.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { OutboxEmailProcessor } from "@/infrastructure/background-jobs/outbox-email-processor.js";

export class BackgroundJobs {
  private readonly outboxEmailProcessor: OutboxEmailProcessor;

  constructor(unitOfWork: IUnitOfWork, emailSender: IEmailSender, logger: ILogger) {
    this.outboxEmailProcessor = new OutboxEmailProcessor(unitOfWork, emailSender, logger);
  }

  start() {
    this.outboxEmailProcessor.start();
  }

  stop() {
    this.outboxEmailProcessor.stop();
  }
}
