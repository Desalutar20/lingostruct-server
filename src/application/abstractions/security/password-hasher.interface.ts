import { ResultAsync } from "@/domain/abstractions/result.js";
import { HashedPassword } from "@/domain/user/hashed-password.js";
import { Password } from "@/domain/user/password.js";

export interface IPasswordHasher {
  hash(password: Password): ResultAsync<HashedPassword>;
  verify(password: Password, hashed: HashedPassword): ResultAsync<boolean>;
}
