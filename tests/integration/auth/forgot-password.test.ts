import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/users/password.js";
import "../helpers/requests/index.js";
import { Email } from "@/domain/shared/value-objects/email.js";

describe("Authentication", () => {
  describe("Forgot Password", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const response = await app.forgotPassword({ email: validData.email }, signal);
        expect(response.status).toBe(200);
      });
    });

    it("Should create password reset token when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await app.signUpAndVerify(validData, signal);

        const response = await app.forgotPassword({ email: validData.email }, signal);
        expect(response.status).toBe(200);

        const token = await app.getTokenFromCache("passwordResetToken");
        expect(token).toBeDefined();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          [
            "Empty email",
            {
              email: "",
            },
            "email",
          ],
          [
            "Whitespace email",
            {
              email: "   ",
            },
            "email",
          ],
          [
            `Email is longer than ${Email.maxLength}`,
            {
              email: `test${"t".repeat(Email.maxLength)}@gmail.com`,
            },
            "email",
          ],
        ] as const;

        await Promise.all(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.forgotPassword(body, signal);
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

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.all(
          [...Array(app.config.rateLimit.forgotPassword)].map(async () => {
            const response = await app.forgotPassword({ email: "invalid email" }, signal);

            expect(response.status).toBe(400);
          }),
        );

        const lastRes = await app.forgotPassword({ email: "invalid email" }, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
