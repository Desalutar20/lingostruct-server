import { Expression, Kysely, Selectable, SqlBool } from "kysely";
import { Email } from "@/domain/shared/value-objects/email.js";
import { UserId } from "@/domain/user/user-id.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";
import { User } from "@/domain/user/user.js";
import { DB, Users } from "../db.types.js";
import { FirstName } from "@/domain/user/first-name.js";
import { LastName } from "@/domain/user/last-name.js";
import { HashedPassword } from "@/domain/user/hashed-password.js";
import { UserRole } from "@/domain/user/user-role.js";
import { ProviderId } from "@/domain/user/provider-id.js";
import { mapDbErrorToAppError } from "../database-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { applyCursorPagination } from "@/infrastructure/data/helpers/apply-cursor-pagination.js";
import { UserFilters } from "@/domain/user/user-filters.js";
import { URL } from "@/domain/shared/value-objects/url.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  getAll(
    filters: UserFilters,
    pagination: KeysetPagination<UserId>,
  ): ResultAsync<KeysetPaginated<User, UserId>> {
    return fromPromise(
      (async () => {
        let query = this.db.selectFrom("users").selectAll();

        query = query.where((eb) => {
          const ands: Expression<SqlBool>[] = [];

          if (filters.search !== undefined) {
            ands.push(
              eb.or([
                eb("email", "=", filters.search.value),
                eb("firstName", "ilike", `%${filters.search.value}%`),
                eb("lastName", "ilike", `%${filters.search.value}%`),
              ]),
            );
          }

          if (filters.isBanned !== undefined) {
            ands.push(eb("isBanned", "=", filters.isBanned));
          }

          if (filters.isVerified !== undefined) {
            ands.push(eb("isVerified", "=", filters.isVerified));
          }

          return eb.and(ands);
        });

        query = applyCursorPagination(pagination, query);

        const data = (await query.execute()).map((row) => UserRepository.toEntity(row));

        return new KeysetPaginated<User, UserId>(data, pagination, (user) => ({
          createdAt: user.createdAt,
          id: user.id,
        }));
      })(),
      (err) => mapDbErrorToAppError(err, "UserRepository.getAll"),
    );
  }

  getById(id: UserId): ResultAsync<User | null> {
    return fromPromise(
      this.db.selectFrom("users").selectAll().where("id", "=", id.value).executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "UserRepository.getById"),
    ).map((row) => (!row ? null : UserRepository.toEntity(row)));
  }

  getByEmail(email: Email): ResultAsync<User | null> {
    return fromPromise(
      this.db.selectFrom("users").selectAll().where("email", "=", email.value).executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "UserRepository.getByEmail"),
    ).map((row) => (!row ? null : UserRepository.toEntity(row)));
  }

  deleteNotVerifiedUsers(): ResultAsync<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 1);

    return fromPromise(
      this.db
        .deleteFrom("users")
        .where((eb) => eb.and([eb("isVerified", "=", false), eb("createdAt", "<", threshold)]))
        .execute(),
      (err) => mapDbErrorToAppError(err, "UserRepository.deleteNotVerifiedUsers"),
    ).map(() => undefined);
  }

  create(user: User): ResultAsync<void> {
    return fromPromise(
      this.db
        .insertInto("users")
        .values({
          id: user.id.value,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          firstName: user.firstName?.value,
          lastName: user.lastName?.value,
          email: user.email.value,
          hashedPassword: user.hashedPassword?.value,
          role: user.role.value,
          isBanned: user.isBanned,
          isVerified: user.isVerified,
          googleId: user.googleId?.value,
          githubId: user.githubId?.value,
          avatarUrl: user.avatarUrl?.value,
        })
        .execute(),
      (err) => mapDbErrorToAppError(err, "UserRepository.create"),
    ).map(() => undefined);
  }

  update(user: User): ResultAsync<void> {
    return fromPromise(
      this.db
        .updateTable("users")
        .set({
          updatedAt: user.updatedAt,
          firstName: user.firstName?.value ?? null,
          lastName: user.lastName?.value ?? null,
          email: user.email.value,
          hashedPassword: user.hashedPassword?.value,
          role: user.role.value,
          isBanned: user.isBanned,
          isVerified: user.isVerified,
          googleId: user.googleId?.value,
          githubId: user.githubId?.value,
          avatarUrl: user.avatarUrl?.value ?? null,
        })
        .where("id", "=", user.id.value)
        .execute(),
      (err) => mapDbErrorToAppError(err, "UserRepository.update"),
    ).map(() => undefined);
  }

  private static toEntity(row: Selectable<Users>): User {
    return User.restore(
      UserId.create(row.id)._unsafeUnwrap(),
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      row.firstName !== null ? FirstName.create(row.firstName)._unsafeUnwrap() : null,
      row.lastName !== null ? LastName.create(row.lastName)._unsafeUnwrap() : null,
      Email.create(row.email)._unsafeUnwrap(),
      row.hashedPassword ? HashedPassword.create(row.hashedPassword)._unsafeUnwrap() : null,
      UserRole.create(row.role)._unsafeUnwrap(),
      row.isBanned,
      row.isVerified,
      row.avatarUrl ? URL.create(row.avatarUrl)._unsafeUnwrap() : null,
      row.googleId ? ProviderId.create(row.googleId)._unsafeUnwrap() : null,
      row.githubId ? ProviderId.create(row.githubId)._unsafeUnwrap() : null,
    );
  }
}
