import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";

export interface IUnitOfWork {
  execute<T>(
    action: (
      repositories: { userRepository: IUserRepository; outboxRepository: IOutboxRepository },
      actions: { commit: () => Promise<void>; rollback: () => Promise<void> },
    ) => Promise<T>,
  ): ResultAsync<T>;
}
