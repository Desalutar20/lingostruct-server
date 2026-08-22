import { Nullable } from "@/app/types.js";
import { KeysetCursorInstance } from "@/domain/shared/pagination/keyset-cursor.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { ValueObject } from "@/domain/shared/value-objects/value-object.js";

export class KeysetPagination<TId extends ValueObject<TId>> {
  constructor(
    public readonly limit: PositiveInt,
    public readonly prevCursor: Nullable<KeysetCursorInstance<TId>>,
    public readonly nextCursor: Nullable<KeysetCursorInstance<TId>>,
  ) {}

  public get direction(): "backward" | "forward" {
    return this.prevCursor !== null ? "backward" : "forward";
  }

  public get cursor() {
    return this.prevCursor ?? this.nextCursor;
  }
}
