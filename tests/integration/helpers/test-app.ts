import { createApp } from "@/app/app.js";
import { Config } from "@/application/config/index.js";
import { loadConfig } from "@/infrastructure/config/index.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { Kysely } from "kysely";
import { setupTestDatabase } from "./test-database.js";
import { setupTestRedis } from "./test-redis.js";
import { RedisClientType } from "redis";

export class TestApp {
  constructor(
    public readonly config: Config,
    protected readonly url: string,
    protected readonly db: Kysely<DB>,
    protected readonly cache: RedisClientType,
    private readonly fastify: Awaited<ReturnType<typeof createApp>>,
  ) {}

  public parseCookie(cookieHeader: string) {
    return this.fastify.parseCookie(cookieHeader);
  }

  public unsignCookie(cookie: string) {
    return this.fastify.unsignCookie(cookie).value;
  }

  public async signUpAndVerify(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    },
    signal?: AbortSignal,
  ) {
    const signUpResponse = await this.signUp(data, signal);
    expect(signUpResponse.status).toBe(201);

    const token = await this.getTokenFromCache("verificationToken");
    expect(token).toBeDefined();

    const response = await this.verifyAccount({
      email: data.email,
      token,
    });
    expect(response.status).toBe(200);
  }

  public async signUpAndSignIn(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    },
    signal?: AbortSignal,
  ) {
    await this.signUpAndVerify(data, signal);

    const response = await this.signIn({ email: data.email, password: data.password }, signal);
    expect(response.status).toBe(200);

    const parsedCookies = this.parseCookie(response.headers.get("Set-Cookie") ?? "");
    const sessionId = this.unsignCookie(parsedCookies[this.config.application.sessionCookieName]);

    expect(sessionId).not.toBeNull();

    return {
      cookies: response.headers.get("Set-Cookie") ?? undefined,
      sessionId: sessionId!,
    };
  }

  public static async run(cb: (app: TestApp) => void | Promise<void>) {
    const config = loadConfig();

    config.rateLimit.signUp = 15;
    config.rateLimit.resetPassword = 15;
    config.rateLimit.updateProfile = 15;

    config.database.database = `test-${crypto.randomUUID()}`;
    config.redis.keyPrefix = `${crypto.randomUUID()}:`;

    const { kysely, cleanDatabase } = await setupTestDatabase(config.database);
    const { redis, cleanRedis } = await setupTestRedis(config.redis);

    const app = await createApp(config);

    await app.listen({
      host: "localhost",
      port: 0,
    });

    const address = app.server.address();
    const port = typeof address === "string" ? address : address?.port;

    const url = `http://localhost:${port}/api/v1`;
    const testApp = new TestApp(config, url, kysely, redis, app);

    try {
      await cb(testApp);
    } finally {
      await app.close();

      await Promise.all([cleanDatabase(), cleanRedis()]);
    }
  }
}
