import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { TestApp } from "../test-app.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

declare module "../test-app.js" {
  interface TestApp {
    getVerificationTokenFromCache(): Promise<string | undefined>;
    getSession(sessionId: string): Promise<string | undefined>;
  }
}

type CacheKeyPrefix<
  T extends string,
  Base extends string,
> = T extends `${Base}${infer Prefix}:${string}` ? `${Base}${Prefix}:` : never;

TestApp.prototype.getVerificationTokenFromCache = async function () {
  const pattern: CacheKeyPrefix<
    ReturnType<(typeof authCacheKeys)["verificationToken" | "session"]>,
    string
  > = `${this.config.redis.keyPrefix}verification-token:`;
  const key = (await this.cache.keys(pattern + "*")).at(-1);

  return key?.split(pattern)[1];
};

TestApp.prototype.getSession = async function (sessionId: string) {
  return (
    (await this.cache.get(authCacheKeys.session(UUID.create(sessionId)._unsafeUnwrap()))) ??
    undefined
  );
};
