import { validation } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { ValueObject } from "@/domain/shared/value-objects/value-object.js";
import { err, ok } from "neverthrow";

export type KeysetCursorInstance<TId extends ValueObject<TId>> = InstanceType<
  ReturnType<typeof KeysetCursor<TId>>
>;

export const KeysetCursor = <TId extends ValueObject<TId>>() => {
  return class KeysetCursor {
    private static readonly cursorSeparator = "|";

    public constructor(
      public readonly createdAt: string,
      public readonly id: TId,
    ) {}

    public static create(
      value: string,
      parseId: (id: string) => Result<TId>,
    ): Result<KeysetCursor> {
      const decoded = Buffer.from(value, "base64").toString("utf-8");
      const parts = decoded.split(KeysetCursor.cursorSeparator);

      if (parts.length !== 2) {
        return err(validation("cursor", ["Invalid cursor"]));
      }

      const errors = [];

      const date = new Date(parts[0]);
      if (date.toString() === "Invalid Date") {
        errors.push("Invalid cursor date format");
      }

      const result = parseId(parts[1]);
      if (result.isErr()) {
        errors.push("Invalid cursor id format");
      }

      return errors.length > 0
        ? err(validation("cursor", errors))
        : ok(new KeysetCursor(parts[0], result._unsafeUnwrap()));
    }

    public toString() {
      const fullValue = `${this.createdAt}${KeysetCursor.cursorSeparator}${this.id}`;

      return Buffer.from(fullValue, "utf8").toString("base64");
    }

    public equals(other: KeysetCursor) {
      return other.createdAt === this.createdAt && other.id.equals(this.id);
    }
  };
};
