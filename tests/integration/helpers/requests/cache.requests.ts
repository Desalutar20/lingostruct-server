import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { TestApp } from "../test-app.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

declare module "../test-app.js" {
  interface TestApp {
    getTokenFromCache(type: TokenKey): Promise<string | undefined>;
    getSession(sessionId: string): Promise<string | undefined>;
  }
}

type TokenKey = Extract<keyof typeof authCacheKeys, "verificationToken" | "passwordResetToken">;

TestApp.prototype.getTokenFromCache = async function (type: TokenKey) {
  const prefix = type === "verificationToken" ? "verification-token:" : "password-reset:";

  const key = (await this.cache.keys(this.config.redis.keyPrefix + prefix + "*")).at(-1);

  return key?.split(prefix)[1];
};

TestApp.prototype.getSession = async function (sessionId: string) {
  return (
    (await this.cache.get(authCacheKeys.session(UUID.create(sessionId)._unsafeUnwrap()))) ??
    undefined
  );
};
