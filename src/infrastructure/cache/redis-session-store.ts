import { ISessionStore } from "@/application/abstractions/auth/session-store.interface.js";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { AUTH_CACHE_KEYS } from "@/application/auth/const/auth-cache-keys.const.js";
import { RedisConfig } from "@/application/config/redis.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { PositiveInt } from "@/domain/shared/value-objects/positive-int.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { UserId } from "@/domain/user/user-id.js";
import { ExtractPrefix } from "@/app/types.js";
import { fromPromise, fromThrowable, ok, Result as Rs, ResultAsync as RsAsync } from "neverthrow";
import { RedisClientType } from "redis";

export class RedisSessionStore implements ISessionStore {
  constructor(
    private readonly client: RedisClientType,
    private readonly config: RedisConfig,
  ) {}

  save(
    userId: UserId,
    sessionId: UUID,
    session: Session,
    ttlSeconds: PositiveInt,
  ): ResultAsync<void> {
    const sessionKey = AUTH_CACHE_KEYS.SESSION(sessionId);
    const userSessionsKey = AUTH_CACHE_KEYS.USER_SESSIONS(userId);

    const score = Date.now() + ttlSeconds.value * 1000;

    return fromPromise(
      (async () => {
        await this.client.zAdd(userSessionsKey, { value: sessionId.value, score });
        await this.client.set(sessionKey, JSON.stringify(session), {
          expiration: { type: "EX", value: ttlSeconds.value },
        });
      })(),
      (err) => internal("Failed to save session to Redis", err),
    );
  }

  get(sessionId: UUID): ResultAsync<Session | null> {
    return fromPromise(this.client.get(AUTH_CACHE_KEYS.SESSION(sessionId)), (err) =>
      internal("Failed to get session from Redis", err),
    ).andThen((session) => {
      if (!session) return ok(null);

      return fromThrowable(JSON.parse, (err) =>
        internal("Failed to parse session from redis", err),
      )(session);
    });
  }

  getSessionIds(userId: UserId): ResultAsync<UUID[]> {
    return fromPromise(this.client.zRange(AUTH_CACHE_KEYS.USER_SESSIONS(userId), 0, -1), (err) =>
      internal("Failed to get Redis session IDs from Redis", err),
    ).andThen((values) => Rs.combine(values.map(UUID.create)));
  }

  updateAll(userId: UserId, session: Session): ResultAsync<void> {
    return this.getSessionIds(userId)
      .andThen((sessionIds) =>
        RsAsync.combine(
          sessionIds.map((sessionId) => {
            const sessionKey = AUTH_CACHE_KEYS.SESSION(sessionId);

            return fromPromise(
              this.client.set(sessionKey, JSON.stringify(session), {
                expiration: "KEEPTTL",
              }),
              (err) => internal("Failed to update all Redis sessions", err),
            );
          }),
        ),
      )
      .map(() => undefined);
  }

  delete(userId: UserId, sessionId: UUID): ResultAsync<void> {
    const sessionKey = AUTH_CACHE_KEYS.SESSION(sessionId);
    const userSessionsKey = AUTH_CACHE_KEYS.USER_SESSIONS(userId);

    return fromPromise(
      (async () => {
        await this.client.zRem(userSessionsKey, sessionId.value);
        await this.client.del(sessionKey);
      })(),
      (err) => internal("Failed to delete Redis session", err),
    );
  }

  deleteAll(userId: UserId): ResultAsync<void> {
    return this.getSessionIds(userId).andThen((sessionIds) =>
      fromPromise(
        (async () => {
          const userSessionsKey = AUTH_CACHE_KEYS.USER_SESSIONS(userId);

          await Promise.all(
            sessionIds.map((sessionId) => this.client.del(AUTH_CACHE_KEYS.SESSION(sessionId))),
          );

          await this.client.del(userSessionsKey);
        })(),
        (err) => internal("Failed to delete all Redis sessions", err),
      ),
    );
  }

  deleteExpired(): ResultAsync<void> {
    return fromPromise(
      (async () => {
        const sessionsKeyPrefix: ExtractPrefix<
          ReturnType<(typeof AUTH_CACHE_KEYS)["USER_SESSIONS"]>,
          ":"
        > = `sessions:`;
        const sessionKeyPrefix: ExtractPrefix<
          ReturnType<(typeof AUTH_CACHE_KEYS)["SESSION"]>,
          ":"
        > = `session:`;

        const pattern = this.config.keyPrefix + `${sessionsKeyPrefix}*`;

        let cursor = "0";

        do {
          const result = await this.client.scan(cursor, {
            MATCH: pattern,
            COUNT: 100,
          });

          cursor = result.cursor;

          for (const key of result.keys) {
            const keyWithoutPrefix = key.slice(this.config.keyPrefix.length);
            const now = Date.now();

            const sessions = await this.client.zRangeByScore(keyWithoutPrefix, -Infinity, now);
            if (sessions.length === 0) continue;

            await Promise.all(
              sessions.map((session) => this.client.del(`${sessionKeyPrefix}:${session}`)),
            );
            await this.client.zRem(keyWithoutPrefix, sessions);

            if ((await this.client.zCard(keyWithoutPrefix)) === 0) {
              await this.client.del(keyWithoutPrefix);
            }
          }
        } while (cursor !== "0");
      })(),
      (err) => internal("Failed to delete expired sessions", err),
    );
  }
}
