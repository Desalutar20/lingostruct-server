import { internal } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class HashedPassword extends NonEmptyString {
  public static readonly minLength: 40;
  public static readonly maxLength: 200;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<HashedPassword> {
    return super
      .create(value, "hashedPassword", "Hashed password", {
        minLength: HashedPassword.minLength,
        maxLength: HashedPassword.maxLength,
      })
      .mapErr(() => internal("Invalid hashed password"))
      .map((val) => new HashedPassword(val.value));
  }
}
