import { RedisConfig } from "@/application/config/redis.config.js";
import { createClient } from "redis";

export const setupTestRedis = async (config: RedisConfig) => {
  const redis = createClient({
    url: config.ConnectionString,
    keyPrefix: config.keyPrefix,
  }).on("error", console.error);

  await redis.connect();

  return {
    redis,
    async cleanRedis() {
      const luaScript = `
          local keys = redis.call('KEYS', ARGV[1])
          if #keys > 0 then
              return redis.call('UNLINK', unpack(keys))
          else
              return 0
          end
        `;

      await redis.eval(luaScript, {
        keys: [],
        arguments: [`${config.keyPrefix}*`],
      });

      await redis.close();
    },
  };
};
