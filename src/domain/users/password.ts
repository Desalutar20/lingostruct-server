import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class Password extends NonEmptyString {
  public static readonly minLength = 8;
  public static readonly maxLength = 60;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<Password> {
    return super
      .create(value, "password", "Password", {
        minLength: Password.minLength,
        maxLength: Password.maxLength,
      })
      .map((val) => new Password(val.value));
  }
}
