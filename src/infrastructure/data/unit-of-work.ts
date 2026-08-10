import { Kysely } from "kysely";
import { IUnitOfWork } from "@/application/abstractions/database/unit-of-work.interface.js";
import { IUserRepository } from "@/domain/users/user-repository.interface.js";
import { UserRepository } from "./users/user-repository.js";
import { DB } from "./db.types.js";
import { OutboxRepository } from "./outbox/outbox-repository.js";
import { IOutboxRepository } from "@/application/abstractions/database/outbox/outbox-repository.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { fromPromise } from "neverthrow";
import { internal } from "@/domain/abstractions/errors.js";

export class UnitOfWork implements IUnitOfWork {
  constructor(private readonly kysely: Kysely<DB>) {}

  execute<T>(
    action: (
      repositories: { userRepository: IUserRepository; outboxRepository: IOutboxRepository },
      actions: { commit: () => ResultAsync<void>; rollback: () => ResultAsync<void> },
    ) => ResultAsync<T>,
  ): ResultAsync<T> {
    return fromPromise(this.kysely.startTransaction().execute(), (err) =>
      internal("Error while starting transaction", err),
    ).andThen((trx) => {
      const userRepository = new UserRepository(trx);
      const outboxRepository = new OutboxRepository(trx);

      return action(
        { userRepository, outboxRepository },
        {
          commit: () =>
            fromPromise(trx.commit().execute(), (err) =>
              internal("Failed to commit database transaction", err),
            ),
          rollback: () =>
            fromPromise(trx.rollback().execute(), (err) =>
              internal("Failed to rollback database transaction", err),
            ),
        },
      );
    });
  }
}
