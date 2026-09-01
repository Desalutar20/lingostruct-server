import { ResultAsync } from "@/domain/abstractions/result.js";
import { IBaseRepository } from "@/domain/shared/base-repository.interface.js";
import { Modify } from "@/app/types.js";
import { KeysetPagination } from "@/domain/shared/pagination/keyset-pagination.js";
import { KeysetPaginated } from "@/domain/shared/pagination/keyset-paginated.js";
import { WorkspaceUser } from "@/domain/workspace-user/workspace-user.js";
import { WorkspaceUserId } from "@/domain/workspace-user/workspace-user-id.js";
import { WorkspaceUserFilters } from "@/domain/workspace-user/workspace-user-filters.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { UserId } from "@/domain/user/user-id.js";

export interface IWorkspaceUserRepository extends Modify<
  IBaseRepository<WorkspaceUser, WorkspaceUserId>,
  {
    getAll: (
      filters: WorkspaceUserFilters,
      pagination: KeysetPagination<WorkspaceUserId>,
    ) => ResultAsync<KeysetPaginated<WorkspaceUser, WorkspaceUserId>>;
  }
> {
  getByWorkspaceAndUserId: (
    workspaceId: WorkspaceId,
    userId: UserId,
  ) => ResultAsync<WorkspaceUser | null>;
}
