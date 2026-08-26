import { internal } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { err, ok } from "neverthrow";

export class OutboxType extends NonEmptyString {
  public static readonly Email = new OutboxType("email");
  public static readonly UserBanStatusChanged = new OutboxType("userBanStatusChanged");

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<OutboxType> {
    switch (value) {
      case "email":
        return ok(OutboxType.Email);

      case "userBanStatusChanged":
        return ok(OutboxType.UserBanStatusChanged);

      default:
        return err(internal(`Invalid outbox type: ${value}`));
    }
  }
}
