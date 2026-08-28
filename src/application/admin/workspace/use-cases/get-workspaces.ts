import { IQueryHandler } from "@/application/abstractions/cqrs/query-handler.interface.js";
import { IQuery } from "@/application/abstractions/cqrs/query.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { WorkspaceFilters } from "@/domain/workspace/workspace-filters.js";

export class GetWorkspacesQuery implements IQuery<KeysetPaginated<AdminWorkspaceDto, WorkspaceId>> {
  constructor(
    readonly filters: WorkspaceFilters,
    readonly pagination: KeysetPagination<WorkspaceId>,
  ) {}
}

export class GetWorkspacesQueryHandlers implements IQueryHandler<
  GetWorkspacesQuery,
  KeysetPaginated<AdminWorkspaceDto, WorkspaceId>
> {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  handle(query: GetWorkspacesQuery): ResultAsync<KeysetPaginated<AdminWorkspaceDto, WorkspaceId>> {
    return this.workspaceRepository.getAll(query.filters, query.pagination).map(
      (data) =>
        new KeysetPaginated(
          data.data.map((workspace) => new AdminWorkspaceDto(workspace)),
          data.prevCursor,
          data.nextCursor,
        ),
    );
  }
}
