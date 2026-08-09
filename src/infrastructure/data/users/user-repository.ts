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
import { throwDatabaseError } from "../database-errors.js";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  async getAll(): Promise<User[]> {
    const rows = await this.db.selectFrom("users").selectAll().execute();

    return rows.map((row) => UserRepository.toEntity(row));
  }

  async getById(id: UserId): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id.value)
      .executeTakeFirst();

    if (!row) return null;

    return UserRepository.toEntity(row);
  }
  async getByEmail(email: Email): Promise<User | null> {
    const row = await this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email.value)
      .executeTakeFirst();

    if (!row) return null;

    return UserRepository.toEntity(row);
  }
  async create(user: User): Promise<void> {
    try {
      await this.db
        .insertInto("users")
        .values({
          id: user.id.value,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          firstName: user.firstName.value,
          lastName: user.lastName.value,
          email: user.email.value,
          hashedPassword: user.hashedPassword?.value,
          role: user.role.value,
          isBanned: user.isBanned,
          isVerified: user.isVerified,
          googleId: user.googleId?.value,
          githubId: user.githubId?.value,
        })
        .execute();
    } catch (error) {
      throwDatabaseError(error);
    }
  }
  async update(user: User): Promise<void> {
    try {
      await this.db
        .updateTable("users")
        .set({
          updatedAt: new Date(),
          firstName: user.firstName.value,
          lastName: user.lastName.value,
          email: user.email.value,
          hashedPassword: user.hashedPassword?.value,
          role: user.role.value,
          isBanned: user.isBanned,
          isVerified: user.isVerified,
          googleId: user.googleId?.value,
          githubId: user.githubId?.value,
        })
        .where("id", "=", user.id.value)
        .execute();
    } catch (error) {
      throwDatabaseError(error);
    }
  }

  private static toEntity(row: Selectable<Users>): User {
    return User.restore(
      UserId.create(row.id)._unsafeUnwrap(),
      row.createdAt,
      row.updatedAt,
      FirstName.create(row.firstName)._unsafeUnwrap(),
      LastName.create(row.lastName)._unsafeUnwrap(),
      Email.create(row.email)._unsafeUnwrap(),
      row.hashedPassword ? HashedPassword.create(row.hashedPassword)._unsafeUnwrap() : null,
      UserRole.create(row.role)._unsafeUnwrap(),
      row.googleId ? ProviderId.create(row.googleId)._unsafeUnwrap() : null,
      row.githubId ? ProviderId.create(row.githubId)._unsafeUnwrap() : null,
    );
  }
}
