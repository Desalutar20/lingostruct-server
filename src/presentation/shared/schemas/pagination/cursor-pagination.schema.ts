import { Result } from "@/domain/abstractions/result.js";
import { KeysetCursor } from "@/domain/shared/pagination/keyset-cursor.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { ValueObject } from "@/domain/shared/value-objects/value-object.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";
import {
  transformToValueObject,
  transformToValueObjectOptional,
} from "@/presentation/shared/schemas/transform-value-object.js";
import z from "zod";

export const CursorPaginationSchema = <T extends ValueObject<T>>(
  fn: (val: string) => Result<T>,
  maxLimit: PositiveInt,
  limit?: PositiveInt,
) =>
  z
    .object({
      prevCursor: NonEmptyStringSchema.optional().transform(
        transformToValueObjectOptional((val) => KeysetCursor<T>().create(val, fn)),
      ),
      nextCursor: NonEmptyStringSchema.optional().transform(
        transformToValueObjectOptional((val) => KeysetCursor<T>().create(val, fn)),
      ),
      limit: z.coerce
        .number()
        .positive()
        .max(maxLimit.value)
        .default(limit?.value || 1)
        .transform(transformToValueObject((val) => PositiveInt.create(val, "limit", "Limit"))),
    })
    .refine(({ prevCursor, nextCursor }) => prevCursor === undefined || nextCursor === undefined, {
      message: "prevCursor and nextCursor cannot be provided together",
      path: ["cursor"],
    });
