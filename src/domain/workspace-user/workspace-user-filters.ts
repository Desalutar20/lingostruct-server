import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";

export class WorkspaceUserFilters {
  constructor(
    public readonly search?: NonEmptyString,
    public readonly roles?: WorkspaceRole[],
  ) {}
}
