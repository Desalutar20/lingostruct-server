import { IEmailSender } from "../../application/abstractions/email/email-sender.interface.js";
import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";
import { IUnitOfWork } from "../../application/abstractions/database/unit-of-work.interface.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { isNodemailerError } from "@/infrastructure/email/nodemailer-guard.js";
import { EmailVerificationOutboxData } from "@/application/abstractions/database/outbox/email-verification-outbox-data.type.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";

export class OutboxEmailProcessor extends CronProcessor {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly emailSender: IEmailSender,
    private readonly logger: ILogger,
  ) {
    super("* * * * *");
  }

  private static BatchSize = PositiveInt.create(30)._unsafeUnwrap();
  private static MaxRetries = 3;

  protected async execute(): Promise<void> {
    await this.unitOfWork.execute(async ({ outboxRepository }, { commit, rollback }) => {
      try {
        const outboxes =
          await outboxRepository.getAndLockPendingOutboxes<EmailVerificationOutboxData>(
            OutboxType.Email,
            OutboxEmailProcessor.BatchSize,
          );

        const ids = [];

        for (const outbox of outboxes) {
          const status = await this.trySendWithRetry(outbox);
          if (status === "failed") {
            continue;
          }

          ids.push(outbox.id);
        }

        if (ids.length > 0) await outboxRepository.markAsProcessedBulk(ids);

        await commit();
      } catch (error) {
        await rollback();

        if (error instanceof Error) {
          this.logger.error(error);
        } else {
          this.logger.error(
            `[OutboxEmail] Failed to process outbox batch. Unknown error: ${String(error)}`,
          );
        }
      }
    });
  }

  private async trySendWithRetry(
    outbox: Outbox<EmailVerificationOutboxData>,
  ): Promise<"success" | "failed"> {
    let retry = 0;

    while (retry < OutboxEmailProcessor.MaxRetries) {
      const result = await Email.create(outbox.data.to).asyncAndThen((email) =>
        this.emailSender.send({
          to: email,

          subject: "outbox.data.subject,",
          text: "outbox.data.subject,",
          html: "outbox.data.subject,",
        }),
      );

      if (result.isOk()) {
        return "success";
      }

      if (result.error.type === "Internal" && isNodemailerError(result.error.error)) {
        retry++;

        this.logger.warn(
          `[OutboxEmail] Email delivery failed, retrying. Attempt ${retry}/${OutboxEmailProcessor.MaxRetries}. Code: ${result.error.error.code}. Message: ${result.error.error.message}`,
        );

        continue;
      }

      this.logger.error(
        `[OutboxEmail] Email delivery failed with a non-retryable error. OutboxId: ${outbox.id.value}`,
        result.error,
      );

      return "failed";
    }

    this.logger.error(
      `[OutboxEmail] Email delivery failed after ${OutboxEmailProcessor.MaxRetries} attempts. OutboxId: ${outbox.id.value}`,
    );

    return "failed";
  }
}
