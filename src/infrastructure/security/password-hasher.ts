import { IPasswordHasher } from "@/application/abstractions/security/password-hasher.interface.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { HashedPassword } from "@/domain/user/hashed-password.js";
import { Password } from "@/domain/user/password.js";

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { fromPromise } from "neverthrow";
import { promisify } from "util";

const scryptPromise = promisify(scrypt);

export class PasswordHasher implements IPasswordHasher {
  hash(password: Password): ResultAsync<HashedPassword> {
    const salt = randomBytes(16).toString("hex");

    return fromPromise(scryptPromise(password.value, salt, 64), (err) =>
      internal("Password hasher", err),
    ).andThen((derivedKey) =>
      HashedPassword.create(salt + ":" + (derivedKey as Buffer).toString("hex")),
    );
  }

  verify(password: Password, hash: HashedPassword): ResultAsync<boolean> {
    const [salt, key] = hash.value.split(":");
    const keyBuffer = Buffer.from(key, "hex");

    return fromPromise(scryptPromise(password.value, salt, 64), (err) =>
      internal("Password hasher", err),
    ).map((derivedKey) => timingSafeEqual(keyBuffer, derivedKey as Buffer));
  }
}
