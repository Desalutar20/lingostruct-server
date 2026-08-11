import { User } from "./user.js";
import { UserId } from "./user-id.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { ResultAsync } from "@/domain/abstractions/result.js";

export interface IUserRepository {
  getAll: () => ResultAsync<User[]>;
  getById: (id: UserId) => ResultAsync<User | null>;
  getByEmail: (email: Email) => ResultAsync<User | null>;
  deleteNotVerifiedUsers: () => ResultAsync<void>;
  create: (user: User) => ResultAsync<void>;
  update: (user: User) => ResultAsync<void>;
}
