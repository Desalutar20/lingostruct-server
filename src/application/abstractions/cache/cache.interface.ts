import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";

export interface ICache {
  set: <T>(key: string, value: T, expireSeconds?: PositiveInt) => ResultAsync<void>;
  addToSortedSet<T>(key: string, value: T, score: PositiveInt): ResultAsync<void>;
  getSortedSet<T>(key: string, order: "asc" | "desc"): ResultAsync<T[]>;
  removeFromSortedSet<T>(key: string, value: T): ResultAsync<void>;
  get: <T>(key: string) => ResultAsync<T | null>;
  getDel<T>(key: string): ResultAsync<T | null>;
  getEx<T>(key: string, expireSeconds: PositiveInt): ResultAsync<T | null>;
  del(key: string): ResultAsync<void>;
}
