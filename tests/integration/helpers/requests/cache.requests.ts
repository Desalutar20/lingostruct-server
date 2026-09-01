import { AUTH_CACHE_KEYS } from "@/application/auth/const/auth-cache-keys.const.js";
import { TestApp } from "../test-app.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

declare module "../test-app.js" {
  interface TestApp {
    getTokenFromCache(type: TokenKey): Promise<string | undefined>;
    getSession(sessionId: string): Promise<string | undefined>;
  }
}

type TokenKey = Extract<
  keyof typeof AUTH_CACHE_KEYS,
  "VERIFICATION_TOKEN" | "PASSWORD_RESET_TOKEN"
>;

TestApp.prototype.getTokenFromCache = async function (type: TokenKey) {
  const prefix = type === "VERIFICATION_TOKEN" ? "verification-token:" : "password-reset:";

  const key = (await this.cache.keys(this.config.redis.keyPrefix + prefix + "*")).at(-1);

  return key?.split(prefix)[1];
};

TestApp.prototype.getSession = async function (sessionId: string) {
  return (
    (await this.cache.get(AUTH_CACHE_KEYS.SESSION(UUID.create(sessionId)._unsafeUnwrap()))) ??
    undefined
  );
};
