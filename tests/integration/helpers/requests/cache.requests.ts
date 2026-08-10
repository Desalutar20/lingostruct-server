import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getVerificationTokenFromCache(): Promise<string | undefined>;
  }
}

type CacheKeyPrefix<
  T extends string,
  Base extends string,
> = T extends `${Base}${infer Prefix}:${string}` ? `${Base}${Prefix}:` : never;

TestApp.prototype.getVerificationTokenFromCache = async function () {
  const pattern: CacheKeyPrefix<
    ReturnType<typeof authCacheKeys.verificationToken>,
    string
  > = `${this.config.redis.keyPrefix}verification-token:`;

  const key = (await this.cache.keys(pattern + "*")).at(-1);

  return key?.split(pattern)[1];
};
