import { Expression, Kysely, Selectable, SqlBool } from "kysely";
import { DB } from "../db.types.js";
import { mapDbErrorToAppError } from "../database-errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { Workspace } from "@/domain/workspace/workspace.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { Workspace as DbWorkspace } from "@/infrastructure/data/db.types.js";
import { WorkspaceFilters } from "@/domain/workspace/workspace-filters.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { applyCursorPagination } from "@/infrastructure/data/helpers/apply-cursor-pagination.js";

export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly db: Kysely<DB>) {}

  getAll(
    filters: WorkspaceFilters,
    pagination: KeysetPagination<WorkspaceId>,
  ): ResultAsync<KeysetPaginated<Workspace, WorkspaceId>> {
    return fromPromise(
      (async () => {
        let query = this.db.selectFrom("workspace").selectAll();

        query = query.where((eb) => {
          const ands: Expression<SqlBool>[] = [];

          if (filters.search !== undefined) {
            ands.push(eb("name", "ilike", `%${filters.search.value}%`));
          }

          return eb.and(ands);
        });

        query = applyCursorPagination(pagination, query);

        const data = (await query.execute()).map((row) => WorkspaceRepository.toEntity(row));

        return new KeysetPaginated<Workspace, WorkspaceId>(data, pagination, (workspace) => ({
          createdAt: workspace.createdAt,
          id: workspace.id,
        }));
      })(),
      (err) => mapDbErrorToAppError(err, "WorkspaceRepository.getAll"),
    );
  }

  getById(id: WorkspaceId): ResultAsync<Workspace | null> {
    return fromPromise(
      this.db.selectFrom("workspace").selectAll().where("id", "=", id.value).executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceRepository.getById"),
    ).map((row) => (!row ? null : WorkspaceRepository.toEntity(row)));
  }

  create(workspace: Workspace): ResultAsync<void> {
    return fromPromise(
      this.db
        .insertInto("workspace")
        .values({
          id: workspace.id.value,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          name: workspace.name.value,
          country: workspace.address.country,
          city: workspace.address.city,
          street: workspace.address.street,
          streetNumber: workspace.address.streetNumber,
          postalCode: workspace.address.postalCode,
        })
        .execute(),
      (err) => mapDbErrorToAppError(err, "WorkspaceRepository.create"),
    ).map(() => undefined);
  }

  update(workspace: Workspace): ResultAsync<undefined> {
    return fromPromise(
      this.db
        .updateTable("workspace")
        .set({
          updatedAt: workspace.updatedAt,
          name: workspace.name.value,
          country: workspace.address.country,
          city: workspace.address.city,
          street: workspace.address.street,
          streetNumber: workspace.address.streetNumber,
          postalCode: workspace.address.postalCode,
        })
        .where("id", "=", workspace.id.value)
        .executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceRepository.update"),
    ).map(() => undefined);
  }

  delete(workspace: Workspace): ResultAsync<void> {
    return fromPromise(
      this.db.deleteFrom("workspace").where("id", "=", workspace.id.value).executeTakeFirst(),
      (err) => mapDbErrorToAppError(err, "WorkspaceRepository.delete"),
    ).map(() => undefined);
  }

  static toEntity(row: Selectable<DbWorkspace>): Workspace {
    return Workspace.restore(
      WorkspaceId.create(row.id)._unsafeUnwrap(),
      row.createdAt.toISOString(),
      row.updatedAt.toISOString(),
      WorkspaceName.create(row.name)._unsafeUnwrap(),
      WorkspaceAddress.create({
        country: row.country,
        city: row.city,
        street: row.street,
        streetNumber: row.streetNumber,
        postalCode: row.postalCode,
      })._unsafeUnwrap(),
    );
  }
}
