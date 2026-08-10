import { createApp } from "@/app.js";
import { Config } from "@/application/config/index.js";
import { loadConfig } from "@/infrastructure/config/index.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { Kysely } from "kysely";
import { setupTestDatabase } from "./test-database.js";
import { setupTestRedis } from "./test-redis.js";
import { RedisClientType } from "redis";

export class TestApp {
  constructor(
    public readonly config: Config,
    protected readonly url: string,
    protected readonly db: Kysely<DB>,
    protected readonly cache: RedisClientType,
  ) {}

  public static async run(cb: (app: TestApp) => void | Promise<void>) {
    const config = loadConfig();

    config.rateLimit.signUp = 15;

    config.database.database = `test-${crypto.randomUUID()}`;
    config.redis.keyPrefix = `${crypto.randomUUID()}:`;

    const { kysely, cleanDatabase } = await setupTestDatabase(config.database);
    const { redis, cleanRedis } = await setupTestRedis(config.redis);

    const app = await createApp(config);

    await app.listen({
      host: "localhost",
      port: 0,
    });

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const url = `http://localhost:${port}/api/v1`;
    const testApp = new TestApp(config, url, kysely, redis);

    try {
      await cb(testApp);
    } finally {
      await app.close();

      await Promise.all([cleanDatabase(), cleanRedis()]);
    }
  }
}
