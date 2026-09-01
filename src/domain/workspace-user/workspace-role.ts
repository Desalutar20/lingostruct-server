import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { validation } from "@/domain/abstractions/errors.js";

export class WorkspaceRole extends NonEmptyString {
  protected override readonly _value: "owner" | "admin" | "member";

  public static readonly Owner = new WorkspaceRole("owner");
  public static readonly Admin = new WorkspaceRole("admin");
  public static readonly Member = new WorkspaceRole("member");

  private constructor(value: "owner" | "admin" | "member") {
    super(value);
    this._value = value;
  }

  public override get value() {
    return this._value;
  }

  public static create(value: string): Result<WorkspaceRole> {
    switch (value) {
      case "owner":
        return ok(WorkspaceRole.Owner);

      case "admin":
        return ok(WorkspaceRole.Admin);

      case "member":
        return ok(WorkspaceRole.Member);

      default:
        return err(validation("workspaceRole", [`Invalid workspace role: ${value}`]));
    }
  }
}
