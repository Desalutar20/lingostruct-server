import { User } from "./user.js";
import { UserId } from "./user-id.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IBaseRepository } from "@/domain/shared/base-repository.interface.js";
import { Modify } from "@/app/types.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { UserFilters } from "@/domain/user/user-filters.js";

export interface IUserRepository extends Modify<
  IBaseRepository<User, UserId>,
  {
    getAll: (
      filters: UserFilters,
      pagination: KeysetPagination<UserId>,
    ) => ResultAsync<KeysetPaginated<User, UserId>>;
  }
> {
  getByEmail: (email: Email) => ResultAsync<User | null>;
  deleteNotVerifiedUsers: () => ResultAsync<void>;
}
