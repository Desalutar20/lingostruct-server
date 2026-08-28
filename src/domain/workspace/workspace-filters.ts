import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class WorkspaceFilters {
  constructor(public readonly search?: NonEmptyString) {}
}
