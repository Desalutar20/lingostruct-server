import { internal } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";
import { err, ok } from "neverthrow";

export class OutboxType extends StringValue {
  public static readonly Email = new OutboxType("email");

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<OutboxType> {
    switch (value) {
      case "email":
        return ok(OutboxType.Email);

      default:
        return err(internal(`Invalid outbox type: ${value}`));
    }
  }
}
