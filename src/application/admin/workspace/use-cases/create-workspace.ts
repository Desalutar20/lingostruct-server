import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { accessForbidden } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { UserId } from "@/domain/user/user-id.js";
import { UserRole } from "@/domain/user/user-role.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { WorkspaceUser } from "@/domain/workspace-user/workspace-user.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { Workspace } from "@/domain/workspace/workspace.js";
import { err } from "neverthrow";

export class CreateWorkspaceCommand implements ICommand<AdminWorkspaceDto> {
  constructor(
    public readonly userId: UserId,
    public readonly name: WorkspaceName,
    public readonly address: WorkspaceAddress,
  ) {}
}

export class CreateWorkspaceCommandHandler implements ICommandHandler<
  CreateWorkspaceCommand,
  AdminWorkspaceDto
> {
  constructor(private readonly unitOfWork: IUnitOfWork) {}

  handle(command: CreateWorkspaceCommand): ResultAsync<AdminWorkspaceDto> {
    const workspace = new Workspace(command.name, command.address);

    return this.unitOfWork
      .execute(
        (
          { userRepository, workspaceRepository, workspaceUserRepository },
          { commit, rollback },
        ) => {
          return userRepository
            .getById(command.userId)
            .andThen((user) => {
              if (!user || !user.role.equals(UserRole.Admin)) {
                return err(accessForbidden());
              }

              return workspaceRepository.create(workspace).andThen(() => {
                const workspaceUser = new WorkspaceUser(
                  WorkspaceRole.Owner,
                  workspace.id,
                  command.userId,
                );

                return workspaceUserRepository.create(workspaceUser);
              });
            })
            .andThen(() => commit())
            .orElse((error) => rollback().andThen(() => err(error)));
        },
      )
      .map(() => new AdminWorkspaceDto(workspace));
  }
}
