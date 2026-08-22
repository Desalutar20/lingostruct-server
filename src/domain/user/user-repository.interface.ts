import { User } from "./user.js";
import { UserId } from "./user-id.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IBaseRepository } from "@/domain/shared/base-repository.interface.js";
import { Modify } from "@/app/types.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";

export class UserFilters {
  constructor(
    public readonly limit: PositiveInt,
    public readonly page: PositiveInt,
  ) {}
}

export interface IUserRepository extends Modify<
  IBaseRepository<User, UserId>,
  {
    getAll: (pagination: KeysetPagination<UserId>) => ResultAsync<KeysetPaginated<User, UserId>>;
  }
> {
  getByEmail: (email: Email) => ResultAsync<User | null>;
  deleteNotVerifiedUsers: () => ResultAsync<void>;
}
