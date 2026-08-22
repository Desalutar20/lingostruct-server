import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class WorkspaceName extends NonEmptyString {
  public static readonly maxLength = 100;

  private constructor(value: string) {
    super(value);
  }

  public static create(value: string): Result<WorkspaceName> {
    return super
      .create(value, "name", "Workspace name", { maxLength: WorkspaceName.maxLength })
      .map((val) => new WorkspaceName(val.value));
  }
}
