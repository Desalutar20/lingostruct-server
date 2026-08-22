import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";

describe("Users", () => {
  describe("Get Me", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.getMe(cookies, signal);
        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data).toMatchObject({
          status: "success",
          data: {
            id: expect.any(String),
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            role: expect.any(String),
            avatarUrl: null,
          },
        });
      });
    });

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.getMe(undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.allSettled(
          [...Array(app.config.rateLimit.getMe)].map(async () => {
            const response = await app.getMe(undefined, signal);

            expect(response.status).toBe(401);
          }),
        );

        const lastRes = await app.getMe(undefined, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
