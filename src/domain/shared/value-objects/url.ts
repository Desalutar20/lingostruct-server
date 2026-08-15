import { validation } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { err, ok } from "neverthrow";

export class URL extends NonEmptyString {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string, field: string = "url"): Result<URL> {
    return super.create(value, field).andThen(() => {
      const isValid = globalThis.URL.canParse(value);
      if (!isValid) return err(validation(field, ["Invalid url"]));

      const url = new globalThis.URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:")
        return err(validation(field, ["Invalid url"]));

      return ok(new URL(url.toString()));
    });
  }
}
