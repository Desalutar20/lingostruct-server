import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { err } from "neverthrow";

export class DeleteWorkspaceCommand implements ICommand<void> {
  constructor(public readonly workspaceId: WorkspaceId) {}
}

export class DeleteWorkspaceCommandHandler implements ICommandHandler<
  DeleteWorkspaceCommand,
  void
> {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}
  handle(command: DeleteWorkspaceCommand): ResultAsync<void> {
    return this.workspaceRepository.getById(command.workspaceId).andThen((workspace) => {
      if (!workspace)
        return err(
          failure(`Workspace with id ${command.workspaceId.value} not found`, "OPERATION_FAILED"),
        );

      return this.workspaceRepository.delete(workspace);
    });
  }
}
