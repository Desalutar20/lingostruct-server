import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class FirstName extends NonEmptyString {
  public static readonly maxLength = 30;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<FirstName> {
    return super
      .create(value, "firstName", "First name", { maxLength: FirstName.maxLength })
      .map((val) => new FirstName(val.value));
  }
}
