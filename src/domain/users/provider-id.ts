import { Result } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";

export class ProviderId extends StringValue {
  public static readonly maxLength: 100;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<ProviderId> {
    return super
      .create(value, "providerId", "Provider ID", { maxLength: ProviderId.maxLength })
      .map((val) => new ProviderId(val.value));
  }
}
