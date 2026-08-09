import { Result } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";

export class FirstName extends StringValue {
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
