import { ResultAsync } from "@/domain/abstractions/result.js";
import { StringValue } from "@/domain/shared/value-objects/string-value.js";

export interface IPasswordHasher {
  hash(password: StringValue): ResultAsync<StringValue>;
  verify(password: StringValue, hashed: StringValue): ResultAsync<boolean>;
}
