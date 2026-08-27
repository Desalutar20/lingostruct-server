import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";
import { Email } from "@/domain/shared/value-objects/email.js";

describe("Authentication", () => {
  describe("Reset Password", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const forgotPasswordResponse = await app.forgotPassword({ email: validData.email }, signal);
        expect(forgotPasswordResponse.status).toBe(200);

        const token = await app.getTokenFromCache("passwordResetToken");
        expect(token).toBeDefined();

        const response = await app.resetPassword({
          email: validData.email,
          token,
          newPassword: faker.internet.password({ length: Password.maxLength - 1 }),
        });
        expect(response.status).toBe(200);
      });
    });

    it("Should reset password and invalidate existing authentication", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { sessionId } = await app.signUpAndSignIn(validData, signal);

        const forgotPasswordResponse = await app.forgotPassword({ email: validData.email }, signal);
        expect(forgotPasswordResponse.status).toBe(200);

        const token = await app.getTokenFromCache("passwordResetToken");
        expect(token).toBeDefined();

        const response = await app.resetPassword({
          email: validData.email,
          token,
          newPassword: faker.internet.password({ length: Password.maxLength - 1 }),
        });
        expect(response.status).toBe(200);

        const tokenAfterReset = await app.getTokenFromCache("passwordResetToken");
        expect(tokenAfterReset).toBeUndefined();

        const session = await app.getSession(sessionId);
        expect(session).toBeUndefined();
      });
    });

    it("Should change user password", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const userBeforeReset = await app.getUserFromDbByEmail(validData.email);
        expect(userBeforeReset).toBeDefined();

        await app.forgotPassword({ email: validData.email }, signal);

        const token = await app.getTokenFromCache("passwordResetToken");
        expect(token).toBeDefined();

        const newPassword = faker.internet.password({
          length: Password.maxLength - 1,
        });

        const response = await app.resetPassword({
          email: validData.email,
          token,
          newPassword,
        });

        expect(response.status).toBe(200);

        const userAfterReset = await app.getUserFromDbByEmail(validData.email);
        expect(userAfterReset!.hashedPassword).not.toBe(userBeforeReset!.hashedPassword);
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          [
            "Empty email",
            {
              email: "",
              token: faker.string.sample(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
            },
            "email",
          ],
          [
            "Whitespace email",
            {
              email: "   ",
              token: faker.string.sample(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
            },
            "email",
          ],
          [
            `Email is longer than ${Email.maxLength}`,
            {
              email: `test${"t".repeat(Email.maxLength)}@gmail.com`,
              token: faker.string.sample(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
            },
            "email",
          ],
          [
            "Empty token",
            {
              email: faker.internet.email(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
              token: "",
            },
            "token",
          ],
          [
            "Whitespace token",
            {
              email: faker.internet.email(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
              token: "   ",
            },
            "token",
          ],
          [
            `Token is longer than 200`,
            {
              email: faker.internet.email(),
              newPassword: faker.internet.password({
                length: Password.maxLength - 1,
              }),
              token: faker.string.alpha(201),
            },
            "token",
          ],
          [
            "Empty password",
            {
              email: faker.internet.email(),
              token: faker.string.sample(),
              password: "",
            },
            "newPassword",
          ],
          [
            "Whitespace password",
            {
              email: faker.internet.email(),
              token: faker.string.sample(),
              password: "   ",
            },
            "newPassword",
          ],
          [
            `Password is shorter than ${Password.minLength}`,
            {
              email: faker.internet.email(),
              token: faker.string.sample(),
              password: faker.internet.password({ length: Password.minLength - 1 }),
            },
            "newPassword",
          ],
          [
            `Password is longer than ${Password.maxLength}`,
            {
              email: faker.internet.email(),
              token: faker.string.sample(),
              password: faker.internet.password({ length: Password.maxLength + 1 }),
            },
            "newPassword",
          ],
        ] as const;

        const results = await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.resetPassword(body, signal);
            expect(response.status, description).toBe(400);

            const data = await response.json();

            expect(data, description).toMatchObject({
              errors: {
                [field]: [expect.any(String)],
              },
            });
          }),
        );

        const errors = results
          .filter((result): result is PromiseRejectedResult => result.status === "rejected")
          .map((result) => result.reason);

        if (errors.length > 0) {
          throw new AggregateError(errors, "Some test cases failed");
        }
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.allSettled(
          [...Array(app.config.rateLimit.resetPassword)].map(async () => {
            const response = await app.resetPassword({ email: "invalid email" }, signal);

            expect(response.status).toBe(400);
          }),
        );

        const lastRes = await app.resetPassword({ email: "invalid email" }, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
