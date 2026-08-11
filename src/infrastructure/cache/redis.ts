import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { RedisConfig } from "@/application/config/redis.config.js";
import { Result, ResultAsync } from "@/domain/abstractions/result.js";
import { createClientPool, RedisArgument, RedisClientPoolType, SetOptions } from "redis";
import { fromPromise, fromThrowable, ok, okAsync, ResultAsync as RsAsync } from "neverthrow";
import { internal } from "@/domain/abstractions/errors.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";

export class Redis implements ICache {
  private readonly pool: RedisClientPoolType;

  constructor(config: RedisConfig, logger: ILogger) {
    this.pool = createClientPool({ url: config.ConnectionString, keyPrefix: config.keyPrefix }).on(
      "error",
      logger.error,
    );
  }

  public async connect() {
    await this.pool.connect();
  }

  public async close() {
    if (this.pool.isOpen) await this.pool.close();
  }

  set<T>(key: string, value: T, expireSeconds?: PositiveInt): ResultAsync<void> {
    return this.convertToRedisArgument(value).asyncAndThen((converted) => {
      const setOptions: SetOptions = expireSeconds
        ? {
            expiration: { type: "EX", value: expireSeconds.value },
          }
        : {};

      return fromPromise(this.pool.set(key, converted, setOptions), (error) =>
        internal("Failed to set Redis value", error),
      ).map(() => undefined);
    });
  }

  get<T>(key: string): ResultAsync<T | null> {
    return this.executeGet(key, { type: "get" });
  }

  getDel<T>(key: string): ResultAsync<T | null> {
    return this.executeGet(key, { type: "getDel" });
  }

  getEx<T>(key: string, expireSeconds: PositiveInt): ResultAsync<T | null> {
    return this.executeGet(key, { type: "getEx", options: { ex: expireSeconds.value } });
  }

  addToSortedSet<T>(key: string, value: T, score: PositiveInt): ResultAsync<void> {
    return this.convertToRedisArgument(value).asyncAndThen((converted) => {
      return fromPromise(this.pool.zAdd(key, { value: converted, score: score.value }), (err) =>
        internal("Failed to add value to Redis sorted set", err),
      ).map(() => undefined);
    });
  }

  getSortedSet<T>(key: string, order: "asc" | "desc"): ResultAsync<T[]> {
    return fromPromise(this.pool.zRange(key, 0, -1, { REV: order === "desc" }), (err) =>
      internal("Failed to get Redis sorted set", err),
    ).andThen((values) =>
      RsAsync.combine(values.map((value) => this.convertFromRedisArgument<T>(value))),
    );
  }

  removeFromSortedSet<T>(key: string, value: T): ResultAsync<void> {
    return this.convertToRedisArgument(value).asyncAndThen((converted) =>
      fromPromise(this.pool.zRem(key, converted), (err) =>
        internal("Failed to remove from Redis sorted set", err),
      ).map(() => undefined),
    );
  }

  del(key: string): ResultAsync<void> {
    return fromPromise(this.pool.del(key), (err) =>
      internal("Failed to delete Redis value", err),
    ).map(() => undefined);
  }

  private executeGet<T>(
    key: string,
    type: { type: "get" } | { type: "getDel" } | { type: "getEx"; options: { ex: number } },
  ): ResultAsync<T | null> {
    const operation =
      type.type === "get"
        ? this.pool.get(key)
        : type.type === "getDel"
          ? this.pool.getDel(key)
          : this.pool.getEx(key, {
              type: "EX",
              value: type.options.ex,
            });

    return fromPromise(operation, (err) => internal("Failed to get Redis value", err)).andThen(
      (value) => {
        if (value === null) return okAsync(null);

        return this.convertFromRedisArgument<T>(value);
      },
    );
  }

  private convertToRedisArgument<T>(value: T): Result<RedisArgument> {
    if (typeof value === "number" || typeof value === "string" || Buffer.isBuffer(value)) {
      return ok(value.toString());
    }

    return fromThrowable(
      () => JSON.stringify(value),
      (err) => internal("Invalid redis data", err),
    )().map((val) => val);
  }

  private convertFromRedisArgument<T>(value: RedisArgument): ResultAsync<T> {
    if (typeof value === "number" || typeof value === "string" || Buffer.isBuffer(value)) {
      return okAsync(value as T);
    }

    return fromThrowable(JSON.parse(value), (err) =>
      internal("Invalid redis data", err),
    )().asyncAndThen((value) => okAsync(value as T));
  }
}
