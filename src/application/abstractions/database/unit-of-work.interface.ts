import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IUserRepository } from "@/domain/user/user-repository.interface.js";
import { IWorkspaceRepository } from "@/domain/workspace/workspace-repository.interface.js";

export interface IUnitOfWork {
  execute<T>(
    action: (
      repositories: {
        userRepository: IUserRepository;
        outboxRepository: IOutboxRepository;
        workspaceRepository: IWorkspaceRepository;
      },
      actions: { commit: () => ResultAsync<void>; rollback: () => ResultAsync<void> },
    ) => ResultAsync<T>,
  ): ResultAsync<T>;
}
