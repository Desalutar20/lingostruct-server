import { Result } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";

export class Password extends StringValue {
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
