import { Kysely } from "kysely";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { DB } from "../db.types.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { Outbox } from "@/application/abstractions/database/outbox/outbox.js";
import { OutboxType } from "@/application/abstractions/database/outbox/outbox-type.js";

export class OutboxRepository implements IOutboxRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async create<T>(outbox: Outbox<T>): Promise<void> {
    await this.db
      .insertInto("outbox")
      .values({
        id: outbox.id.value,
        createdAt: outbox.createdAt,
        updatedAt: outbox.updatedAt,
        type: outbox.type.value,
        data: JSON.stringify(outbox.data),
        processedAt: outbox.processedAt,
      })
      .execute();
  }

  async getAndLockPendingOutboxes<T>(type: OutboxType, limit: PositiveInt): Promise<Outbox<T>[]> {
    const rows = await this.db
      .selectFrom("outbox")
      .selectAll()
      .where((eb) => eb.and([eb("processedAt", "is", null), eb("type", "=", type.value)]))
      .orderBy("createdAt", "asc")
      .forUpdate()
      .skipLocked()
      .limit(limit.value)
      .execute();

    return rows.map((row) =>
      Outbox.restore(
        UUID.create(row.id)._unsafeUnwrap(),
        row.createdAt,
        row.updatedAt,
        OutboxType.create(row.type)._unsafeUnwrap(),
        row.data as T,
        row.processedAt,
      ),
    );
  }

  async markAsProcessedBulk(ids: UUID[]): Promise<void> {
    await this.db
      .updateTable("outbox")
      .set({ processedAt: new Date(), updatedAt: new Date() })
      .where(
        "id",
        "in",
        ids.map((id) => id.value),
      )
      .execute();
  }
}
