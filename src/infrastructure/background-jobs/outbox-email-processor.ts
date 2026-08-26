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
import { err, errAsync, fromPromise, okAsync, ResultAsync as RsAsync } from "neverthrow";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { internal } from "@/domain/abstractions/errors.js";
import { EmailTemplateRenderer } from "@/infrastructure/email/email-template-renderer.js";

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
          if (Array.isArray(error)) {
            for (const err of error) {
              this.logger.error("message" in err ? err.message : `${err.type}- ${err.code}`);
            }
          } else {
            this.logger.error("message" in error ? error.message : `${error.type}- ${error.code}`);
          }

          return rollback();
        }),
    );
  }

  trySendWithRetry(outbox: Outbox<OutboxEmailData>): ResultAsync<void> {
    const emailResult = Email.create(outbox.data.email);
    if (emailResult.isErr()) return errAsync(emailResult.error);

    const emailMessage = this.emailTemplateRenderer.render(
      outbox.data.type,
      emailResult.value,
      outbox.data.token,
    );

    return fromPromise(
      (async () => {
        let attempt = 1;

        while (attempt <= OutboxEmailProcessor.MaxRetries) {
          const result = await this.emailSender.send(emailMessage);
          if (result.isOk()) {
            return result;
          }

          const error = result.error;
          if (
            error.type === "Internal" &&
            isNodemailerError(error.error) &&
            attempt < OutboxEmailProcessor.MaxRetries
          ) {
            this.logger.warn(
              `[OutboxEmailProcessor] Email delivery failed, retrying. ` +
                `Attempt ${attempt}/${OutboxEmailProcessor.MaxRetries}. ` +
                `Message: ${error.error.message}`,
            );
            attempt++;

            continue;
          }

          this.logger.error(
            `[OutboxEmailProcessor] Email delivery failed after ` +
              `${OutboxEmailProcessor.MaxRetries} attempts. ` +
              `OutboxId: ${outbox.id.value}`,
            error,
          );

          return result;
        }

        return err(
          internal(
            `Failed to complete email delivery retry attempts. ` + `OutboxId: ${outbox.id.value}`,
          ),
        );
      })(),
      (error) =>
        internal(
          `Failed to execute email delivery retry loop. OutboxId: ${outbox.id.value}`,
          error,
        ),
    ).andThen((result) => result);
  }
}
