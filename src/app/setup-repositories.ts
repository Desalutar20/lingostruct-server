import { DB } from "@/infrastructure/data/db.types.js";
import { OutboxRepository } from "@/infrastructure/data/outbox/outbox-repository.js";
import { UnitOfWork } from "@/infrastructure/data/unit-of-work.js";
import { UserRepository } from "@/infrastructure/data/user/user-repository.js";
import { WorkspaceRepository } from "@/infrastructure/data/workspace/workspace-repository.js";
import { Kysely } from "kysely";

export const setupRepositories = (db: Kysely<DB>) => {
  return {
    unitOfWork: new UnitOfWork(db),
    userRepository: new UserRepository(db),
    outboxRepository: new OutboxRepository(db),
    workspaceRepository: new WorkspaceRepository(db),
  };
};
