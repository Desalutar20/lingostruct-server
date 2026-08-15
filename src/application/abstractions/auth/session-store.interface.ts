import { Session } from "@/application/abstractions/auth/session.type.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/users/user-id.js";

export interface ISessionStore {
  save(
    userId: UserId,
    sessionId: UUID,
    session: Session,
    ttlSeconds: PositiveInt,
  ): ResultAsync<void>;
  get(sessionId: UUID): ResultAsync<Session | null>;
  getSessionIds(userId: UserId): ResultAsync<UUID[]>;
  updateAll(userId: UserId, session: Session): ResultAsync<void>;
  delete(userId: UserId, sessionId: UUID): ResultAsync<void>;
  deleteAll(userId: UserId): ResultAsync<void>;
  deleteExpired(): ResultAsync<void>;
}
