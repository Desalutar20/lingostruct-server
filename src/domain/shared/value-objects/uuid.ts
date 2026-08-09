import { err, ok } from "neverthrow";
import { StringValue } from "./string-value.js";
import { validation } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";

export class UUID extends StringValue {
  protected constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<UUID> {
    return super
      .create(value, "uuid", "UUID", {
        additionalCheck: (value) => {
          if (
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              value,
            )
          ) {
            return err(validation("uuid", ["Invalid UUID"]));
          }

          return ok();
        },
      })
      .map((value) => new UUID(value.value));
  }

  public static generate(): UUID {
    return new UUID(crypto.randomUUID());
  }
}
