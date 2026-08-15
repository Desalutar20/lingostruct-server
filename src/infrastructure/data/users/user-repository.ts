import { Kysely, Selectable } from "kysely";
import { Email } from "@/domain/shared/value-objects/email.js";
import { UserId } from "@/domain/users/user-id.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { User } from "@/domain/users/user.js";
import { DB, Users } from "../db.types.js";
import { FirstName } from "@/domain/users/first-name.js";
import { LastName } from "@/domain/users/last-name.js";
import { HashedPassword } from "@/domain/users/hashed-password.js";
import { UserRole } from "@/domain/users/user-role.js";
import { ProviderId } from "@/domain/users/provider-id.js";
import { mapDbErrorToAppError } from "../database-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { URL } from "@/domain/shared/value-objects/url.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  getAll(): ResultAsync<User[]> {
    return fromPromise(this.db.selectFrom("users").selectAll().execute(), (err) =>
      mapDbErrorToAppError(err, "UserRepository.getAll"),
    ).map((rows) => rows.map((row) => UserRepository.toEntity(row)));
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
          firstName: user.firstName?.value,
          lastName: user.lastName?.value,
          email: user.email.value,
          hashedPassword: user.hashedPassword?.value,
          role: user.role.value,
          isBanned: user.isBanned,
          isVerified: user.isVerified,
          googleId: user.googleId?.value,
          githubId: user.githubId?.value,
        })
        .where("id", "=", user.id.value)
        .execute(),
      (err) => mapDbErrorToAppError(err, "UserRepository.update"),
    ).map(() => undefined);
  }

  private static toEntity(row: Selectable<Users>): User {
    return User.restore(
      UserId.create(row.id)._unsafeUnwrap(),
      row.createdAt,
      row.updatedAt,
      row.firstName !== null ? FirstName.create(row.firstName)._unsafeUnwrap() : null,
      row.lastName !== null ? LastName.create(row.lastName)._unsafeUnwrap() : null,
      Email.create(row.email)._unsafeUnwrap(),
      row.hashedPassword ? HashedPassword.create(row.hashedPassword)._unsafeUnwrap() : null,
      UserRole.create(row.role)._unsafeUnwrap(),
      row.isBanned,
      row.isVerified,
      row.googleId ? ProviderId.create(row.googleId)._unsafeUnwrap() : null,
      row.githubId ? ProviderId.create(row.githubId)._unsafeUnwrap() : null,
      row.avatarUrl ? URL.create(row.avatarUrl)._unsafeUnwrap() : null,
    );
  }
}
