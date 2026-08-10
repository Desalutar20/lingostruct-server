import { ResultAsync } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export interface IPasswordHasher {
  hash(password: NonEmptyString): ResultAsync<NonEmptyString>;
  verify(password: NonEmptyString, hashed: NonEmptyString): ResultAsync<boolean>;
}
