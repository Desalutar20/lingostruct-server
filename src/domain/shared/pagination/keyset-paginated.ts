import { ValueObject } from "@/domain/shared/value-objects/value-object.js";
import { KeysetCursor, KeysetCursorInstance } from "@/domain/shared/pagination/keyset-cursor.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { Nullable } from "@/app/types.js";

export class KeysetPaginated<T, TId extends ValueObject<TId>> {
  public readonly data: Readonly<T[]>;
  public readonly prevCursor: Nullable<KeysetCursorInstance<TId>> = null;
  public readonly nextCursor: Nullable<KeysetCursorInstance<TId>> = null;

  constructor(
    data: Readonly<T[]>,
    prevCursor: Nullable<KeysetCursorInstance<TId>>,
    nextCursor: Nullable<KeysetCursorInstance<TId>>,
  );
  constructor(
    data: Readonly<T[]>,
    pagination: KeysetPagination<TId>,
    getKey: (item: T) => { createdAt: string; id: TId },
  );

  constructor(
    data: Readonly<T[]>,
    arg2: Nullable<KeysetCursorInstance<TId>> | KeysetPagination<TId>,
    arg3: Nullable<KeysetCursorInstance<TId>> | ((item: T) => { createdAt: string; id: TId }),
  ) {
    this.data = data;

    if (arg2 instanceof KeysetPagination) {
      const direction = arg2.direction;

      const hasMore = this.data.length > arg2.limit.value;
      if (hasMore) {
        this.data = this.data.slice(0, this.data.length - 1);
      }

      const keysetClass = KeysetCursor<TId>();
      const fn = arg3 as (item: T) => { createdAt: string; id: TId };

      if (direction === "forward" && arg2.nextCursor !== null) {
        const { createdAt, id } = fn(this.data[0]);
        this.prevCursor = new keysetClass(createdAt, id);
      }

      if (direction === "backward" && hasMore) {
        const { createdAt, id } = fn(this.data.at(-1)!);
        this.prevCursor = new keysetClass(createdAt, id);
      }

      if (direction === "forward" && hasMore) {
        const { createdAt, id } = fn(this.data.at(-1)!);
        this.nextCursor = new keysetClass(createdAt, id);
      }

      if (direction === "backward" && arg2.prevCursor !== null) {
        const { createdAt, id } = fn(this.data[0]);
        this.nextCursor = new keysetClass(createdAt, id);
      }

      if (direction === "backward") {
        this.data = this.data.toReversed();
      }
    } else {
      this.prevCursor = arg2;
      this.nextCursor = arg3 as Nullable<KeysetCursorInstance<TId>>;
    }
  }
}
