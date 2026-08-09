import { Entity } from "@/domain/abstractions/entity.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { Nullable } from "@/shared/types/nullable.type.js";
import { OutboxType } from "./outbox-type.js";

export class Outbox<T> extends Entity {
  private constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    private readonly _type: OutboxType,
    private readonly _data: T,
    private readonly _processedAt: Nullable<Date>,
  ) {
    super(id, createdAt, updatedAt);
  }

  public get type() {
    return this._type;
  }

  public get data() {
    return this._data;
  }

  public get processedAt() {
    return this._processedAt;
  }

  public static create<T>(type: OutboxType, data: T) {
    return new Outbox(UUID.generate(), new Date(), new Date(), type, data, null);
  }

  public static restore<T>(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    type: OutboxType,
    data: T,
    processedAt: Nullable<Date>,
  ) {
    return new Outbox(id, createdAt, updatedAt, type, data, processedAt);
  }
}
