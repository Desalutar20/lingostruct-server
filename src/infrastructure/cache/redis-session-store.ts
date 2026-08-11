import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { authCacheKeys } from "@/application/auth/auth-cache-keys.js";
import { RedisConfig } from "@/application/config/redis.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/users/user-id.js";
import { ExtractPrefix } from "@/shared/types.js";
import { fromPromise, fromThrowable, ok, Result as Rs } from "neverthrow";
import { RedisClientPoolType } from "redis";

export class RedisSessionStore implements ISessionStore {
  constructor(
    private readonly pool: RedisClientPoolType,
    private readonly config: RedisConfig,
  ) {}

  save(
    userId: UserId,
    sessionId: UUID,
    session: Session,
    ttlSeconds: PositiveInt,
  ): ResultAsync<void> {
    const sessionKey = authCacheKeys.session(sessionId);
    const userSessionsKey = authCacheKeys.userSessions(userId);

    const score = Date.now() + ttlSeconds.value * 1000;

    return fromPromise(
      (async () => {
        await this.pool.zAdd(userSessionsKey, { value: sessionId.value, score });
        await this.pool.set(sessionKey, JSON.stringify(session), {
          expiration: { type: "EX", value: ttlSeconds.value },
        });
      })(),
      (err) => internal("Failed to save session to Redis", err),
    );
  }

  get(sessionId: UUID): ResultAsync<Session | null> {
    return fromPromise(this.pool.get(authCacheKeys.session(sessionId)), (err) =>
      internal("Failed to get session from Redis", err),
    ).andThen((session) => {
      if (!session) return ok(null);

      return fromThrowable(JSON.parse, (err) =>
        internal("Failed to parse session from redis", err),
      )(session);
    });
  }

  getSessionIds(userId: UserId): ResultAsync<UUID[]> {
    return fromPromise(this.pool.zRange(authCacheKeys.userSessions(userId), 0, -1), (err) =>
      internal("Failed to get Redis session IDs from Redis", err),
    ).andThen((values) => Rs.combine(values.map(UUID.create)));
  }

  delete(userId: UserId, sessionId: UUID): ResultAsync<void> {
    const sessionKey = authCacheKeys.session(sessionId);
    const userSessionsKey = authCacheKeys.userSessions(userId);

    return fromPromise(
      (async () => {
        await this.pool.zRem(userSessionsKey, sessionId.value);
        await this.pool.del(sessionKey);
      })(),
      (err) => internal("Failed to delete Redis session", err),
    );
  }

  deleteAll(userId: UserId): ResultAsync<void> {
    return this.getSessionIds(userId).andThen((sessionIds) =>
      fromPromise(
        (async () => {
          const userSessionsKey = authCacheKeys.userSessions(userId);

          await Promise.all(
            sessionIds.map((sessionId) => this.pool.del(authCacheKeys.session(sessionId))),
          );

          await this.pool.del(userSessionsKey);
        })(),
        (err) => internal("Failed to delete all Redis sessions", err),
      ),
    );
  }

  deleteExpired(): ResultAsync<void> {
    return fromPromise(
      (async () => {
        const sessionsKeyPrefix: ExtractPrefix<
          ReturnType<(typeof authCacheKeys)["userSessions"]>,
          ":"
        > = `sessions:`;
        const sessionKeyPrefix: ExtractPrefix<
          ReturnType<(typeof authCacheKeys)["session"]>,
          ":"
        > = `session:`;

        const pattern = this.config.keyPrefix + `${sessionsKeyPrefix}*`;

        let cursor = "0";

        do {
          const result = await this.pool.scan(cursor, {
            MATCH: pattern,
            COUNT: 100,
          });

          cursor = result.cursor;

          for (const key of result.keys) {
            const keyWithoutPrefix = key.slice(this.config.keyPrefix.length);
            const now = Date.now();

            const sessions = await this.pool.zRangeByScore(keyWithoutPrefix, -Infinity, now);
            if (sessions.length === 0) continue;

            await Promise.all(
              sessions.map((session) => this.pool.del(`${sessionKeyPrefix}:${session}`)),
            );
            await this.pool.zRem(keyWithoutPrefix, sessions);

            if ((await this.pool.zCard(keyWithoutPrefix)) === 0) {
              await this.pool.del(keyWithoutPrefix);
            }
          }
        } while (cursor !== "0");
      })(),
      (err) => internal("Failed to delete expired sessions", err),
    );
  }
}
