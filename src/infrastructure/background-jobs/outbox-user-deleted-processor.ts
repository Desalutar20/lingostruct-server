import { CronProcessor } from "@/infrastructure/background-jobs/cron-processor.js";
import { IUnitOfWork } from "../../application/abstractions/database/unit-of-work.interface.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";

import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { errAsync, okAsync, ResultAsync as RsAsync } from "neverthrow";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { UserId } from "@/domain/user/user-id.js";
import { OutboxUserDeletedData } from "@/application/abstractions/database/outbox/outbox-data.type.js";

export class OutboxUserDeletedProcessor extends CronProcessor {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly sessionStore: ISessionStore,
    private readonly logger: ILogger,
  ) {
    super("* * * * *");
  }

  private static BatchSize = PositiveInt.create(30)._unsafeUnwrap();

  protected async execute(): Promise<void> {
    await this.unitOfWork.execute(({ outboxRepository }, { commit, rollback }) =>
      outboxRepository
        .getAndLockPendingOutboxes<OutboxUserDeletedData>(
          OutboxType.UserDeleted,
          OutboxUserDeletedProcessor.BatchSize,
        )
        .andThen((outboxes) =>
          RsAsync.combineWithAllErrors(
            outboxes.map((outbox) => this.deleteSession(outbox).map(() => outbox.id)),
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

  deleteSession(outbox: Outbox<OutboxUserDeletedData>): ResultAsync<void> {
    const userIdResult = UserId.create(outbox.data.userId);
    if (userIdResult.isErr()) return errAsync(userIdResult.error);

    return this.sessionStore.deleteAll(userIdResult.value);
  }
}
