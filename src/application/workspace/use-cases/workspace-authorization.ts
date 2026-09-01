import { ICache } from "@/application/abstractions/cache/cache.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { ApplicationConfig } from "@/application/config/application.config.js";
import { WORKSPACE_CACHE_KEYS } from "@/application/workspace/const/workspace-cache-keys.const.js";
import { accessForbidden } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UserId } from "@/domain/user/user-id.js";
import { WorkspaceRole } from "@/domain/workspace-user/workspace-role.js";
import { IWorkspaceUserRepository } from "@/domain/workspace-user/workspace-user-repository.interface.js";
import { WorkspaceId } from "@/domain/workspace/workspace-id.js";
import { err, ok } from "neverthrow";

export class WorkspaceAccessAuthorizationCommand implements ICommand<void> {
  constructor(
    public readonly workspaceId: WorkspaceId,
    public readonly userId: UserId,
    public readonly roles: WorkspaceRole[],
  ) {}
}

export class WorkspaceAccessAuthorizationCommandHandler implements ICommandHandler<
  WorkspaceAccessAuthorizationCommand,
  void
> {
  private readonly workspaceAccessTTLSeconds: PositiveInt;

  constructor(
    private readonly workspaceUserRepository: IWorkspaceUserRepository,
    private readonly cache: ICache,
    config: ApplicationConfig,
  ) {
    this.workspaceAccessTTLSeconds = PositiveInt.create(
      config.workspaceAccessTTLMinutes * 60,
    )._unsafeUnwrap();
  }

  handle(command: WorkspaceAccessAuthorizationCommand): ResultAsync<void> {
    const key = WORKSPACE_CACHE_KEYS.WORKSPACE_USER(command.workspaceId, command.userId);

    return this.cache
      .getEx(key, this.workspaceAccessTTLSeconds)
      .andThen((role) => {
        if (role !== null) {
          return WorkspaceRole.create(role.toString()).mapErr(() => accessForbidden());
        }

        return this.workspaceUserRepository
          .getByWorkspaceAndUserId(command.workspaceId, command.userId)
          .andThen((workspaceUser) => {
            if (!workspaceUser) {
              return err(accessForbidden());
            }

            return this.cache.set(key, workspaceUser.role.value).map(() => workspaceUser.role);
          });
      })
      .andThen((role) => {
        const hasAccess = command.roles.some((r) => r.equals(role));
        if (!hasAccess) return err(accessForbidden());

        return ok();
      });
  }
}
