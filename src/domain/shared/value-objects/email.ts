import { err, ok } from "neverthrow";
import { StringValue } from "./string-value.js";
import { validation } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";

export class Email extends StringValue {
  public static readonly maxLength = 150;

  constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<Email> {
    return super
      .create(value, "email", "Email", {
        maxLength: Email.maxLength,
        additionalCheck: (value) => {
          if (!/^\S+@\S+\.\S+$/.test(value)) {
            return err(validation("email", ["Invalid email format"]));
          }

          return ok();
        },
      })
      .map((val) => new Email(val.value));
  }
}
