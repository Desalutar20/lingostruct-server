import { Entity } from "@/domain/abstractions/entity.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { OutboxType } from "./outbox-type.js";
import { Nullable } from "@/app/types.js";
import { nowIso } from "@/app/helpers.js";

export class Outbox<T> extends Entity {
  private _processedAt: Nullable<string> = null;

  public constructor(
    private readonly _type: OutboxType,
    private readonly _data: T,
  ) {
    const now = nowIso();
    super(UUID.generate(), now, now);
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

  public static restore<T>(
    id: UUID,
    createdAt: string,
    updatedAt: string,
    type: OutboxType,
    data: T,
    processedAt: Nullable<string>,
  ) {
    const outbox = new Outbox(type, data);

    outbox._id = id;
    outbox._createdAt = createdAt;
    outbox._updatedAt = updatedAt;
    outbox._processedAt = processedAt;

    return outbox;
  }
}
