import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { OutboxType } from "./outbox-type.js";
import { Outbox } from "./outbox.js";
import { ResultAsync } from "@/domain/abstractions/result.js";

export interface IOutboxRepository {
  getAndLockPendingOutboxes: <T>(type: OutboxType, limit: PositiveInt) => ResultAsync<Outbox<T>[]>;
  markAsProcessedBulk: (ids: UUID[]) => ResultAsync<void>;
  create: <T>(outbox: Outbox<T>) => ResultAsync<void>;
}
