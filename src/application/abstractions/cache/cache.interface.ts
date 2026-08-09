import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";

export interface ICache {
  set: <T>(key: string, value: T, expireSeconds?: PositiveInt) => ResultAsync<void>;
  get: <T>(key: string) => ResultAsync<T | null>;
  getDel<T>(key: string): ResultAsync<T | null>;
  getEx<T>(key: string, expireSeconds: PositiveInt): ResultAsync<T | null>;
}
