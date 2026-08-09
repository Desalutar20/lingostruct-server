import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { RedisConfig } from "@/application/config/redis.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { createClientPool, RedisClientPoolType, SetOptions } from "redis";
import { errAsync, fromPromise, fromThrowable, okAsync } from "neverthrow";
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
    let converted;

    if (typeof value === "number" || typeof value === "string" || Buffer.isBuffer(value)) {
      converted = value;
    } else {
      const result = fromThrowable(
        () => JSON.stringify(value),
        (err) => internal("Invalid redis data", err),
      )();

      if (result.isErr()) {
        return errAsync(result.error);
      }

      converted = result.value;
    }

    const setOptions: SetOptions = expireSeconds
      ? {
          expiration: { type: "EX", value: expireSeconds.value },
        }
      : {};

    return fromPromise(this.pool.set(key, converted, setOptions), (error) =>
      internal("Failed to set Redis value", error),
    ).map(() => undefined);
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

        if (typeof value === "number" || typeof value === "string" || Buffer.isBuffer(value)) {
          return okAsync(value as T);
        }

        return okAsync(
          fromThrowable(JSON.parse(value), (err) => internal("Invalid redis data", err)),
        ).map((value) => value as T);
      },
    );
  }
}
