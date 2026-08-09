import { StringValue } from "@/domain/shared/value-objects/string-value.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { validation } from "@/domain/abstractions/errors.js";

export class UserRole extends StringValue {
  public static readonly Admin = new UserRole("admin");
  public static readonly Regular = new UserRole("regular");

  private constructor(value: "admin" | "regular") {
    super(value);
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
