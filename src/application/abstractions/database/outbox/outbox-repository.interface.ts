import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { OutboxType } from "./outbox-type.js";
import { Outbox } from "./outbox.js";

export interface IOutboxRepository {
  getAndLockPendingOutboxes: <T>(type: OutboxType, limit: PositiveInt) => Promise<Outbox<T>[]>;
  markAsProcessedBulk: (ids: UUID[]) => Promise<void>;
  create: <T>(outbox: Outbox<T>) => Promise<void>;
}
