import { IQueryHandler } from "@/application/abstractions/cqrs/query-handler.interface.js";
import { IQuery } from "@/application/abstractions/cqrs/query.interface.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { err, ok } from "neverthrow";

export class GetWorkspaceQuery implements IQuery<AdminWorkspaceDto> {
  constructor(public readonly workspaceId: WorkspaceId) {}
}

export class GetWorkspaceQueryHandler implements IQueryHandler<
  GetWorkspaceQuery,
  AdminWorkspaceDto
> {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  handle(command: GetWorkspaceQuery): ResultAsync<AdminWorkspaceDto> {
    return this.workspaceRepository.getById(command.workspaceId).andThen((workspace) => {
      if (!workspace) {
        return err(
          failure(`Workspace with id ${command.workspaceId.value} not found`, "OPERATION_FAILED"),
        );
      }

      return ok(new AdminWorkspaceDto(workspace));
    });
  }
}
