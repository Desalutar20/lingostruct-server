import { Modify } from "@/app/types.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IBaseRepository } from "@/domain/shared/base-repository.interface.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { WorkspaceFilters } from "@/domain/workspace/workspace-filters.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { Workspace } from "@/domain/workspace/workspace.js";

export interface IWorkspaceRepository extends Modify<
  IBaseRepository<Workspace, WorkspaceId>,
  {
    getAll: (
      filters: WorkspaceFilters,
      pagination: KeysetPagination<WorkspaceId>,
    ) => ResultAsync<KeysetPaginated<Workspace, WorkspaceId>>;
  }
> {}
