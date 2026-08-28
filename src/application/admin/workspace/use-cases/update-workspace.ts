import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { failure } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";
import { err, okAsync } from "neverthrow";

export class UpdateWorkspaceCommand implements ICommand<void> {
  constructor(
    public readonly id: WorkspaceId,
    public readonly name?: WorkspaceName,
    public readonly address?: {
      country?: string;
      city?: string;
      street?: string;
      streetNumber?: string;
      postalCode?: string;
    },
  ) {}
}

export class UpdateWorkspaceCommandHandler implements ICommandHandler<
  UpdateWorkspaceCommand,
  void
> {
  constructor(public readonly workspaceRepository: IWorkspaceRepository) {}

  handle(command: UpdateWorkspaceCommand): ResultAsync<void> {
    return this.workspaceRepository.getById(command.id).andThen((workspace) => {
      if (workspace === null)
        return err(failure(`Workspace with id ${command.id.value} not found`, "OPERATION_FAILED"));

      let address: WorkspaceAddress | undefined;

      if (command.address) {
        const result = WorkspaceAddress.create({
          country: command.address.country ?? workspace.address.country,
          city: command.address.city ?? workspace.address.city,
          street: command.address.street ?? workspace.address.street,
          streetNumber: command.address.streetNumber ?? workspace.address.streetNumber,
          postalCode: command.address.postalCode ?? workspace.address.postalCode,
        });

        if (result.isErr()) {
          return err(result.error[0]);
        }

        address = result.value;
      }

      const isUpdated = workspace.update(command.name, address);
      if (!isUpdated) return okAsync();

      return this.workspaceRepository.update(workspace);
    });
  }
}
