import { Result } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";

export class LastName extends StringValue {
  public static readonly maxLength = 50;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<LastName> {
    return super
      .create(value, "lastName", "Last name", { maxLength: LastName.maxLength })
      .map((val) => new LastName(val.value));
  }
}
