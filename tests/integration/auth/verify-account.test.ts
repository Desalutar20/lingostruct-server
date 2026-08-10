import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/users/password.js";
import "../helpers/requests/index.js";
import { Email } from "@/domain/shared/value-objects/email.js";

describe("Authentication", () => {
  describe("Verify Account", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const signUpResponse = await app.signUp(validData, signal);
        expect(signUpResponse.status).toBe(201);

        const token = await app.getVerificationTokenFromCache();
        expect(token).toBeDefined();

        const response = await app.verifyAccount({
          email: validData.email,
          token,
        });
        expect(response.status).toBe(200);
      });
    });

    it("Should mark the user as verified when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const signUpResponse = await app.signUp(validData, signal);
        expect(signUpResponse.status).toBe(201);

        const token = await app.getVerificationTokenFromCache();
        expect(token).toBeDefined();

        const response = await app.verifyAccount({
          email: validData.email,
          token,
        });
        expect(response.status).toBe(200);

        const userFromDb = await app.getUserFromDbByEmail(validData.email);

        expect(userFromDb).not.toBeUndefined();
        expect(userFromDb!.isVerified).toBeTruthy();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          [
            "Empty email",
            {
              token: faker.string.sample(),
              email: "",
            },
            "email",
          ],
          [
            "Whitespace email",
            {
              token: faker.string.sample(),
              email: "   ",
            },
            "email",
          ],
          [
            `Email is longer than ${Email.maxLength}`,
            {
              token: faker.string.sample(),
              email: `test${"t".repeat(Email.maxLength)}@gmail.com`,
            },
            "email",
          ],
          [
            "Empty token",
            {
              email: faker.internet.email(),
              token: "",
            },
            "token",
          ],
          [
            "Whitespace token",
            {
              email: faker.internet.email(),
              token: "   ",
            },
            "token",
          ],
          [
            `Token is longer than 200`,
            {
              email: faker.internet.email(),
              token: faker.string.alpha(201),
            },
            "token",
          ],
        ] as const;

        await Promise.all(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.verifyAccount(body, signal);
            expect(response.status, description).toBe(400);

            const data = await response.json();

            expect(data, description).toMatchObject({
              errors: {
                [field]: [expect.any(String)],
              },
            });
          }),
        );
      });
    });

    it("Should return 400 status code when user doesn't exist or user is banned", async ({
      signal,
    }) => {
      await TestApp.run(async (app) => {
        for (let index = 0; index < 2; index++) {
          const signUpResponse = await app.signUp(validData, signal);
          expect(signUpResponse.status).toBe(201);

          const token = await app.getVerificationTokenFromCache();
          expect(token).toBeDefined();

          if (index === 0) await app.deleteUserFromDbByEmail(validData.email);
          else {
            await app.banUserInDbByEmail(validData.email);
            const user = await app.getUserFromDbByEmail(validData.email);

            expect(user?.isBanned).toBe(true);
          }

          const response = await app.verifyAccount({
            email: validData.email,
            token,
          });
          expect(response.status, index === 0 ? "Delete" : "Ban").toBe(400);
        }
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.all(
          [...Array(app.config.rateLimit.verifyAccount)].map(async () => {
            const response = await app.verifyAccount(
              { token: faker.string.sample(), email: "invalid email" },
              signal,
            );

            expect(response.status).toBe(400);
          }),
        );

        const lastRes = await app.verifyAccount(
          { token: faker.string.sample(), email: "invalid email" },
          signal,
        );
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
