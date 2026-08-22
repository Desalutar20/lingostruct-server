import { IBaseRepository } from "@/domain/shared/base-repository.interface.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { Workspace } from "@/domain/workspace/workspace.js";

export interface IWorkspaceRepository extends IBaseRepository<Workspace, WorkspaceId> {}
