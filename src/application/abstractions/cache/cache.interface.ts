import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";

export interface ICache {
  set: <T extends string | number | Buffer>(
    key: string,
    value: T,
    expireSeconds?: PositiveInt,
  ) => ResultAsync<void>;
  get: <T extends string | number | Buffer>(key: string) => ResultAsync<T | null>;
  getDel<T extends string | number | Buffer>(key: string): ResultAsync<T | null>;
  getEx<T extends string | number | Buffer>(
    key: string,
    expireSeconds: PositiveInt,
  ): ResultAsync<T | null>;
  del(key: string): ResultAsync<void>;
}
