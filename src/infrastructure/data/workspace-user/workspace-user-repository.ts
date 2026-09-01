import { Expression, Kysely, Selectable, SqlBool } from "kysely";
import { mapDbErrorToAppError } from "../database-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import {
  DB,
  WorkspaceUser as DbWorkspaceUser,
  Users,
  Workspace as DbWorkspace,
} from "@/infrastructure/data/db.types.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { applyCursorPagination } from "@/infrastructure/data/helpers/apply-cursor-pagination.js";
import { IWorkspaceUserRepository } from "@/domain/workspace-user/workspace-user-repository.interface.js";
import { WorkspaceUser } from "@/domain/workspace-user/workspace-user.js";
import { WorkspaceUserId } from "@/domain/workspace-user/workspace-user-id.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { UserId } from "@/domain/user/user-id.js";
import { WorkspaceUserFilters } from "@/domain/workspace-user/workspace-user-filters.js";
import { WorkspaceRepository } from "@/infrastructure/data/workspace/workspace-repository.js";
import { UserRepository } from "@/infrastructure/data/user/user-repository.js";

type SelectableWorkspace = Selectable<DbWorkspace>;
type SelectableUser = Selectable<Users>;

type WorkspaceSelect = {
  workspaceId: SelectableWorkspace["id"];
  workspaceCreatedAt: SelectableWorkspace["createdAt"];
  workspaceUpdatedAt: SelectableWorkspace["updatedAt"];
  workspaceName: SelectableWorkspace["name"];
  workspaceCountry: SelectableWorkspace["country"];
  workspaceCity: SelectableWorkspace["city"];
  workspaceStreet: SelectableWorkspace["street"];
  workspaceStreetNumber: SelectableWorkspace["streetNumber"];
  workspacePostalCode: SelectableWorkspace["postalCode"];
};

type UserSelect = {
  userId: SelectableUser["id"];
  userCreatedAt: SelectableUser["createdAt"];
  userUpdatedAt: SelectableUser["updatedAt"];
  userEmail: SelectableUser["email"];
  userFirstName: SelectableUser["firstName"];
  userLastName: SelectableUser["lastName"];
  userHashedPassword: SelectableUser["hashedPassword"];
  userIsBanned: SelectableUser["isBanned"];
  userIsVerified: SelectableUser["isVerified"];
  userRole: SelectableUser["role"];
  userAvatarUrl: SelectableUser["avatarUrl"];
  userGithubId: SelectableUser["githubId"];
  userGoogleId: SelectableUser["googleId"];
};

type WorkspaceUserWithRelationsRow = Selectable<DbWorkspaceUser> & WorkspaceSelect & UserSelect;

export class WorkspaceUserRepository implements IWorkspaceUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  getAll(
    filters: WorkspaceUserFilters,
    pagination: KeysetPagination<WorkspaceUserId>,
  ): ResultAsync<KeysetPaginated<WorkspaceUser, WorkspaceUserId>> {
    return fromPromise(
      (async () => {
        let query = this.baseQuery;

        query = query.where((eb) => {
          const ands: Expression<SqlBool>[] = [];

          if (filters.search !== undefined) {
            ands.push(
              eb.or([
                eb("users.email", "=", filters.search.value),
                eb("users.firstName", "ilike", `%${filters.search.value}%`),
                eb("users.lastName", "ilike", `%${filters.search.value}%`),
              ]),
            );
          }

          if (filters.roles !== undefined) {
            ands.push(
              eb(
                "role",
                "in",
                filters.roles.map((role) => role.value),
              ),
            );
          }

          return eb.and(ands);
        });

        query = applyCursorPagination(pagination, query);

        const data = (await query.execute()).map((row) => WorkspaceUserRepository.toEntity(row));

        return new KeysetPaginated<WorkspaceUser, WorkspaceUserId>(
          data,
          pagination,
          (workspaceId) => ({
            createdAt: workspaceId.createdAt,
            id: workspaceId.id,
          }),
        );
      })(),
      (err) => mapDbErrorToAppError(err, "WorkspaceUserRepository.getAll"),
    );
  }

  getById(id: WorkspaceUserId): ResultAsync<WorkspaceUser | null> {
    return fromPromise(this.baseQuery.where("id", "=", id.value).executeTakeFirst(), (err) =>
      mapDbErrorToAppError(err, "WorkspaceUserRepository.getById"),
    ).map((row) => (!row ? null : WorkspaceUserRepository.toEntity(row)));
  }

  getByWorkspaceAndUserId(
    workspaceId: WorkspaceId,
    userId: UserId,
  ): ResultAsync<WorkspaceUser | null> {
    return fromPromise(
      this.baseQuery
        .where((eb) =>
          eb.and([eb("workspaceId", "=", workspaceId.value), eb("userId", "=", userId.value)]),
        )
        .executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceUserRepository.getByWorkspaceAndUserId"),
    ).map((row) => (!row ? null : WorkspaceUserRepository.toEntity(row)));
  }

  create(workspaceUser: WorkspaceUser): ResultAsync<void> {
    return fromPromise(
      this.db
        .insertInto("workspaceUser")
        .values({
          id: workspaceUser.id.value,
          createdAt: workspaceUser.createdAt,
          updatedAt: workspaceUser.updatedAt,
          role: workspaceUser.role.value,
          workspaceId: workspaceUser.workspaceId.value,
          userId: workspaceUser.userId.value,
        })
        .execute(),
      (err) => mapDbErrorToAppError(err, "WorkspaceUserRepository.create"),
    ).map(() => undefined);
  }

  update(workspaceUser: WorkspaceUser): ResultAsync<undefined> {
    return fromPromise(
      this.db
        .updateTable("workspaceUser")
        .set({
          updatedAt: workspaceUser.updatedAt,
          role: workspaceUser.role.value,
          workspaceId: workspaceUser.workspaceId.value,
          userId: workspaceUser.userId.value,
        })
        .where("id", "=", workspaceUser.id.value)
        .executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceUserRepository.update"),
    ).map(() => undefined);
  }

  delete(workspaceUser: WorkspaceUser): ResultAsync<void> {
    return fromPromise(
      this.db
        .deleteFrom("workspaceUser")
        .where("id", "=", workspaceUser.id.value)
        .executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceUserRepository.delete"),
    ).map(() => undefined);
  }

  private get baseQuery() {
    return this.db
      .selectFrom("workspaceUser")
      .innerJoin("workspace", "workspace.id", "workspaceUser.workspaceId")
      .innerJoin("users", "users.id", "workspaceUser.userId")
      .select([
        "workspaceUser.id",
        "workspace.createdAt",
        "workspaceUser.updatedAt",
        "workspaceUser.role",
        "workspaceUser.workspaceId",
        "workspaceUser.userId",

        "workspace.id as workspaceId",
        "workspace.createdAt as workspaceCreatedAt",
        "workspace.updatedAt as workspaceUpdatedAt",
        "workspace.name as workspaceName",
        "workspace.country as workspaceCountry",
        "workspace.city as workspaceCity",
        "workspace.street as workspaceStreet",
        "workspace.streetNumber as workspaceStreetNumber",
        "workspace.postalCode as workspacePostalCode",

        "users.id as userId",
        "users.createdAt as userCreatedAt",
        "users.updatedAt as userUpdatedAt",
        "users.email as userEmail",
        "users.firstName as userFirstName",
        "users.lastName as userLastName",
        "users.hashedPassword as userHashedPassword",
        "users.isBanned as userIsBanned",
        "users.isVerified as userIsVerified",
        "users.role as userRole",
        "users.avatarUrl as userAvatarUrl",
        "users.githubId as userGithubId",
        "users.googleId as userGoogleId",
      ]);
  }

  private static toEntity(row: WorkspaceUserWithRelationsRow): WorkspaceUser {
    return WorkspaceUser.restore(
      WorkspaceUserId.create(row.id)._unsafeUnwrap(),
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      WorkspaceRole.create(row.role)._unsafeUnwrap(),
      WorkspaceId.create(row.workspaceId)._unsafeUnwrap(),
      UserId.create(row.userId)._unsafeUnwrap(),
      WorkspaceRepository.toEntity({
        id: row.workspaceId,
        createdAt: row.workspaceCreatedAt,
        updatedAt: row.workspaceUpdatedAt,
        name: row.workspaceName,
        country: row.workspaceCountry,
        city: row.workspaceCity,
        street: row.workspaceStreet,
        streetNumber: row.workspaceStreetNumber,
        postalCode: row.workspacePostalCode,
      }),
      UserRepository.toEntity({
        id: row.workspaceId,
        createdAt: row.userCreatedAt,
        updatedAt: row.userUpdatedAt,
        firstName: row.userFirstName,
        lastName: row.userLastName,
        email: row.userEmail,
        hashedPassword: row.userHashedPassword,
        role: row.userRole,
        isBanned: row.userIsBanned,
        isVerified: row.userIsVerified,
        avatarUrl: row.userAvatarUrl,
        googleId: row.userGoogleId,
        githubId: row.userGithubId,
      }),
    );
  }
}
