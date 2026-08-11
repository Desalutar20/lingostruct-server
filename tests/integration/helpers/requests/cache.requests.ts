import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { TestApp } from "../test-app.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { ExtractPrefix } from "@/shared/types.js";

declare module "../test-app.js" {
  interface TestApp {
    getVerificationTokenFromCache(): Promise<string | undefined>;
    getSession(sessionId: string): Promise<string | undefined>;
  }
}

TestApp.prototype.getVerificationTokenFromCache = async function () {
  const pattern: ExtractPrefix<
    ReturnType<(typeof authCacheKeys)["verificationToken" | "session"]>,
    ":"
  > = `verification-token:`;
  const key = (await this.cache.keys(this.config.redis.keyPrefix + pattern + "*")).at(-1);

  return key?.split(pattern)[1];
};

TestApp.prototype.getSession = async function (sessionId: string) {
  return (
    (await this.cache.get(authCacheKeys.session(UUID.create(sessionId)._unsafeUnwrap()))) ??
    undefined
  );
};
