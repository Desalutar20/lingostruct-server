import { IQueryHandler } from "@/application/abstractions/cqrs/query-handler.interface.js";
import { IQuery } from "@/application/abstractions/cqrs/query.interface.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { UserFilters } from "@/domain/user/user-filters.js";
import { UserId } from "@/domain/user/user-id.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";

export class GetUsersQuery implements IQuery<KeysetPaginated<AdminUserDto, UserId>> {
  constructor(
    readonly filters: UserFilters,
    readonly pagination: KeysetPagination<UserId>,
  ) {}
}

export class GetUsersQueryHandlers implements IQueryHandler<
  GetUsersQuery,
  KeysetPaginated<AdminUserDto, UserId>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  handle(query: GetUsersQuery): ResultAsync<KeysetPaginated<AdminUserDto, UserId>> {
    return this.userRepository.getAll(query.filters, query.pagination).map(
      (data) =>
        new KeysetPaginated(
          data.data.map((user) => new AdminUserDto(user)),
          data.prevCursor,
          data.nextCursor,
        ),
    );
  }
}
