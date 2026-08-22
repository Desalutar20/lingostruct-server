import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { ValueObject } from "@/domain/shared/value-objects/value-object.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { SelectQueryBuilder } from "kysely";

export const applyCursorPagination = <
  TId extends ValueObject<TId>,
  TB extends keyof DB,
  O extends { id: string; createdAt: Date },
>(
  pagination: KeysetPagination<TId>,
  qb: SelectQueryBuilder<DB, TB, O>,
) => {
  const direction = pagination.direction;
  const cursor = pagination.cursor;

  if (cursor !== null) {
    qb = qb.where((eb) =>
      eb.or([
        eb("createdAt", direction === "backward" ? ">" : "<", cursor.createdAt),
        eb.and([
          eb("createdAt", "=", cursor.createdAt),
          eb("id", direction === "backward" ? ">" : "<", cursor.id.value),
        ]),
      ]),
    );
  }

  return qb
    .orderBy("createdAt", direction === "backward" ? "asc" : "desc")
    .orderBy("id", direction === "backward" ? "asc" : "desc")
    .limit(pagination.limit.value + 1);
};
