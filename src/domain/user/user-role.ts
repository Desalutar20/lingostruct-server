import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { validation } from "@/domain/abstractions/errors.js";

export class UserRole extends NonEmptyString {
  protected override readonly _value: "admin" | "regular";

  public static readonly Admin = new UserRole("admin");
  public static readonly Regular = new UserRole("regular");

  private constructor(value: "admin" | "regular") {
    super(value);
    this._value = value;
  }

  public override get value() {
    return this._value;
  }

  public static create(value: string): Result<UserRole> {
    switch (value) {
      case "admin":
        return ok(UserRole.Admin);

      case "regular":
        return ok(UserRole.Regular);

      default:
        return err(validation("role", [`Invalid user role: ${value}`]));
    }
  }
}
