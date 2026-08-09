import { User } from "./user.js";
import { UserId } from "./user-id.js";
import { Email } from "@/domain/shared/value-objects/email.js";

export interface IUserRepository {
  getAll: () => Promise<User[]>;
  getById: (id: UserId) => Promise<User | null>;
  getByEmail: (email: Email) => Promise<User | null>;
  create: (user: User) => Promise<void>;
  update: (user: User) => Promise<void>;
}
