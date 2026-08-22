import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";

describe("Authentication", () => {
  describe("Logout", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.logout(cookies, signal);
        expect(response.status).toBe(200);
      });
    });

    it("Should reset existing authentication", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies, sessionId } = await app.signUpAndSignIn(validData, signal);

        const response = await app.logout(cookies, signal);
        expect(response.status).toBe(200);

        const parsedCookies = app.parseCookie(response.headers.get("Set-Cookie") ?? "");
        const cookieSession = app.unsignCookie(
          parsedCookies[app.config.application.sessionCookieName],
        );
        expect(cookieSession).toBeNull();

        const session = await app.getSession(sessionId);
        expect(session).toBeUndefined();
      });
    });

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.logout(undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.allSettled(
          [...Array(app.config.rateLimit.logout)].map(async () => {
            const response = await app.logout(undefined, signal);

            expect(response.status).toBe(401);
          }),
        );

        const lastRes = await app.logout(undefined, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
