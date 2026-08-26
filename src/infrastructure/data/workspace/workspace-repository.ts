import { Kysely, Selectable } from "kysely";
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

export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly db: Kysely<DB>) {}

  getAll(): ResultAsync<Workspace[]> {
    return fromPromise(this.db.selectFrom("workspace").selectAll().execute(), (err) =>
      mapDbErrorToAppError(err, "WorkspaceRepository.getAll"),
    ).map((rows) => rows.map((row) => WorkspaceRepository.toEntity(row)));
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

  update(workspace: Workspace): ResultAsync<bigint> {
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
    ).map((result) => result.numUpdatedRows);
  }

  private static toEntity(row: Selectable<DbWorkspace>): Workspace {
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
