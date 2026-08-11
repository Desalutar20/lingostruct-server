import { ResultAsync } from "@/domain/abstractions/result.js";
import { HashedPassword } from "@/domain/users/hashed-password.js";
import { Password } from "@/domain/users/password.js";

export interface IPasswordHasher {
  hash(password: Password): ResultAsync<HashedPassword>;
  verify(password: Password, hashed: HashedPassword): ResultAsync<boolean>;
}
