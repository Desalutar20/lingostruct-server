import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class UserFilters {
  constructor(
    public readonly search?: NonEmptyString,
    public readonly isBanned?: boolean,
    public readonly isVerified?: boolean,
  ) {}
}
