import { Kysely } from "kysely";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { DB } from "../db.types.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { mapDbErrorToAppError } from "@/infrastructure/data/database-errors.js";

export class OutboxRepository implements IOutboxRepository {
  constructor(private readonly db: Kysely<DB>) {}

  create<T>(outbox: Outbox<T>): ResultAsync<void> {
    return fromPromise(
      this.db
        .insertInto("outbox")
        .values({
          id: outbox.id.value,
          createdAt: outbox.createdAt,
          updatedAt: outbox.updatedAt,
          type: outbox.type.value,
          data: JSON.stringify(outbox.data),
          processedAt: outbox.processedAt,
        })
        .execute(),
      (err) => mapDbErrorToAppError(err, "OutboxRepository.create"),
    ).map(() => undefined);
  }

  getAndLockPendingOutboxes<T>(type: OutboxType, limit: PositiveInt): ResultAsync<Outbox<T>[]> {
    return fromPromise(
      this.db
        .selectFrom("outbox")
        .selectAll()
        .where((eb) => eb.and([eb("processedAt", "is", null), eb("type", "=", type.value)]))
        .orderBy("createdAt", "asc")
        .forUpdate()
        .skipLocked()
        .limit(limit.value)
        .execute(),
      (err) => mapDbErrorToAppError(err, "OutboxRepository.getAndLockPendingOutboxes"),
    ).map((rows) =>
      rows.map((row) =>
        Outbox.restore(
          UUID.create(row.id)._unsafeUnwrap(),
          row.createdAt,
          row.updatedAt,
          OutboxType.create(row.type)._unsafeUnwrap(),
          row.data as T,
          row.processedAt,
        ),
      ),
    );
  }

  markAsProcessedBulk(ids: UUID[]): ResultAsync<void> {
    return fromPromise(
      this.db
        .updateTable("outbox")
        .set({ processedAt: new Date(), updatedAt: new Date() })
        .where(
          "id",
          "in",
          ids.map((id) => id.value),
        )
        .execute(),
      (err) => mapDbErrorToAppError(err, "OutboxRepository.markAsProcessedBulk"),
    ).map(() => undefined);
  }
}
