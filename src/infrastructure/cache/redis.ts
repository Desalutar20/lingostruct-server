import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { RedisConfig } from "@/application/config/redis.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { createClient, RedisClientType, SetOptions } from "redis";
import { fromPromise } from "neverthrow";
import { internal } from "@/domain/abstractions/errors.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";

export class Redis implements ICache {
  public readonly client: RedisClientType;

  constructor(config: RedisConfig, logger: ILogger) {
    this.client = createClient({ url: config.ConnectionString, keyPrefix: config.keyPrefix }).on(
      "error",
      logger.error,
    );
  }

  public async connect() {
    await this.client.connect();
  }

  public async close() {
    if (this.client.isOpen) await this.client.close();
  }

  set<T extends string | number | Buffer>(
    key: string,
    value: T,
    expireSeconds?: PositiveInt,
  ): ResultAsync<void> {
    const setOptions: SetOptions = expireSeconds
      ? {
          expiration: { type: "EX", value: expireSeconds.value },
        }
      : {};

    return fromPromise(this.client.set(key, value, setOptions), (error) =>
      internal("Failed to set Redis value", error),
    ).map(() => undefined);
  }

  get<T extends string | number | Buffer>(key: string): ResultAsync<T | null> {
    return this.executeGet(key, { type: "get" });
  }

  getDel<T extends string | number | Buffer>(key: string): ResultAsync<T | null> {
    return this.executeGet(key, { type: "getDel" });
  }

  getEx<T extends string | number | Buffer>(
    key: string,
    expireSeconds: PositiveInt,
  ): ResultAsync<T | null> {
    return this.executeGet(key, { type: "getEx", options: { ex: expireSeconds.value } });
  }

  del(key: string): ResultAsync<void> {
    return fromPromise(this.client.del(key), (err) =>
      internal("Failed to delete Redis value", err),
    ).map(() => undefined);
  }

  async deleteExpiredSessions() {
    const pattern = "sessions:*";
    const keys = await this.client.keys(pattern);

    for (const key of keys) {
      const now = Date.now();
      const sessions = await this.client.zRangeByScore(key, -Infinity, now);
      if (sessions.length === 0) continue;

      await this.client.zRem(key, sessions);

      for (const session of sessions) {
        await this.del(`session:${session}`);
      }
    }
  }

  private executeGet<T extends string | number | Buffer>(
    key: string,
    type: { type: "get" } | { type: "getDel" } | { type: "getEx"; options: { ex: number } },
  ): ResultAsync<T | null> {
    const operation =
      type.type === "get"
        ? this.client.get(key)
        : type.type === "getDel"
          ? this.client.getDel(key)
          : this.client.getEx(key, {
              type: "EX",
              value: type.options.ex,
            });

    return fromPromise(operation, (err) => internal("Failed to get Redis value", err)).map(
      (value) => value as T | null,
    );
  }
}
