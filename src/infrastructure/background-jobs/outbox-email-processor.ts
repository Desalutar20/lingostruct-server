import { IEmailSender } from "../../application/abstractions/email/email-sender.interface.js";
import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";
import { IUnitOfWork } from "../../application/abstractions/database/unit-of-work.interface.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { isNodemailerError } from "@/infrastructure/email/nodemailer-guard.js";

import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { OutboxEmailData } from "@/application/abstractions/database/outbox/outbox-data.type.js";
import { errAsync, okAsync, ResultAsync as RsAsync } from "neverthrow";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { internal } from "@/domain/abstractions/errors.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";
import { EmailMessage } from "@/application/abstractions/email/email-message.type.js";

export class OutboxEmailProcessor extends CronProcessor {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly emailSender: IEmailSender,
    private readonly logger: ILogger,
    private readonly emailTemplateRenderer: EmailTemplateRenderer,
  ) {
    super("* * * * *");
  }

  private static BatchSize = PositiveInt.create(30)._unsafeUnwrap();
  private static MaxRetries = 3;

  protected async execute(): Promise<void> {
    await this.unitOfWork.execute(({ outboxRepository }, { commit, rollback }) =>
      outboxRepository
        .getAndLockPendingOutboxes<OutboxEmailData>(
          OutboxType.Email,
          OutboxEmailProcessor.BatchSize,
        )
        .andThen((outboxes) =>
          RsAsync.combineWithAllErrors(
            outboxes.map((outbox) =>
              this.trySendWithRetry(outbox).andThen(() => okAsync(outbox.id)),
            ),
          )
            .andThen((ids) => {
              if (ids.length > 0) return outboxRepository.markAsProcessedBulk(ids);

              return okAsync();
            })
            .andThen(commit),
        )
        .orElse((error) => {
          if (error instanceof Error) {
            this.logger.error(error);
          } else {
            this.logger.error(
              `[OutboxEmailProcessor] Failed to process outbox batch. Unknown error: ${String(error)}`,
            );
          }

          return rollback();
        }),
    );
  }

  private trySendWithRetry(outbox: Outbox<OutboxEmailData>): ResultAsync<void> {
    let retry = 0;

    while (retry < OutboxEmailProcessor.MaxRetries) {
      return Email.create(outbox.data.email)
        .map((val) => this.getEmailMessage(val, outbox))
        .asyncAndThen((message) =>
          this.emailSender
            .send(message)
            .andThen(() => okAsync())
            .orTee((error) => {
              if (
                error.type === "Internal" &&
                isNodemailerError(error.error) &&
                retry < OutboxEmailProcessor.MaxRetries
              ) {
                retry++;

                this.logger.warn(
                  `[OutboxEmailProcessor] Email delivery failed, retrying. ` +
                    `Attempt ${retry}/${OutboxEmailProcessor.MaxRetries}. ` +
                    `Code: ${error.error.code}. ` +
                    `Message: ${error.error.message}`,
                );

                return;
              }

              this.logger.error(
                `[OutboxEmailProcessor] Email delivery failed after ` +
                  `${OutboxEmailProcessor.MaxRetries} attempts. ` +
                  `OutboxId: ${outbox.id.value}`,
                error,
              );

              return errAsync(error);
            }),
        );
    }

    return errAsync(internal(""));
  }

  private getEmailMessage(email: Email, data: Outbox<OutboxEmailData>): EmailMessage {
    switch (data.data.type) {
      case "accountVerification":
        return this.emailTemplateRenderer.renderAccountVerificationEmail(email, data.data.token);
      default:
        const x: never = data.data.type;
        return x;
    }
  }

  // private  trySendWithRetry(outbox: Outbox<OutboxEmailData>): ResultAsync<void> {
  //   let retry = 0;

  //   while (retry < OutboxEmailProcessor.MaxRetries) {
  //     const result = await Email.create(outbox.data.email).asyncAndThen((email) =>
  //       this.emailSender.send({
  //         to: email,

  //         subject: "outbox.data.subject,",
  //         text: "outbox.data.subject,",
  //         html: "outbox.data.subject,",
  //       }),
  //     );

  //     if (result.isOk()) {
  //       return okAsync()
  //     }

  //     if (result.error.type === "Internal" && isNodemailerError(result.error.error)) {
  //       retry++;

  //       this.logger.warn(
  //         `[OutboxEmail] Email delivery failed, retrying. Attempt ${retry}/${OutboxEmailProcessor.MaxRetries}. Code: ${result.error.error.code}. Message: ${result.error.error.message}`,
  //       );

  //       continue;
  //     }

  //     this.logger.error(
  //       `[OutboxEmail] Email delivery failed with a non-retryable error. OutboxId: ${outbox.id.value}`,
  //       result.error,
  //     );

  //     return "failed";
  //   }

  //   this.logger.error(
  //     `[OutboxEmail] Email delivery failed after ${OutboxEmailProcessor.MaxRetries} attempts. OutboxId: ${outbox.id.value}`,
  //   );

  //   return "failed";
  // }
}
