import { ResultAsync } from "@/domain/abstractions/result.js";

export interface IBaseRepository<T, TId> {
  getAll: () => ResultAsync<T[]>;
  getById: (id: TId) => ResultAsync<T | null>;
  create: (entity: T) => ResultAsync<void>;
  update: (entity: T) => ResultAsync<void>;
}
