import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { Workspace } from "@/domain/workspace/workspace.js";

export class CreateWorkspaceCommand implements ICommand<AdminWorkspaceDto> {
  constructor(
    public readonly name: WorkspaceName,
    public readonly address: WorkspaceAddress,
  ) {}
}

export class CreateWorkspaceCommandHandler implements ICommandHandler<
  CreateWorkspaceCommand,
  AdminWorkspaceDto
> {
  constructor(private readonly workspaceRepository: IWorkspaceRepository) {}

  handle(command: CreateWorkspaceCommand): ResultAsync<AdminWorkspaceDto> {
    const workspace = new Workspace(command.name, command.address);

    return this.workspaceRepository.create(workspace).map(() => new AdminWorkspaceDto(workspace));
  }
}
