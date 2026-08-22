import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";
import { FirstName } from "@/domain/user/first-name.js";
import { LastName } from "@/domain/user/last-name.js";
import { Email } from "@/domain/shared/value-objects/email.js";

describe("Authentication", () => {
  describe("Sign Up", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 201 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.signUp(validData, signal);

        expect(response.status).toBe(201);
      });
    });

    it("Should create a user in the database when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.signUp(validData, signal);

        expect(response.status).toBe(201);

        const userFromDb = await app.getUserFromDbByEmail(validData.email);

        expect(userFromDb).toBeDefined();
        expect(userFromDb!.isVerified).toBeFalsy();
        expect(userFromDb!.email).toBe(validData.email);
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          [
            "Empty first name",
            {
              ...validData,
              firstName: "",
            },
            "firstName",
          ],
          [
            "Whitespace first name",
            {
              ...validData,
              firstName: "   ",
            },
            "firstName",
          ],
          [
            `First name is longer than ${FirstName.maxLength}`,
            {
              ...validData,
              firstName: faker.string.sample(FirstName.maxLength + 1),
            },
            "firstName",
          ],
          [
            "Empty last name",
            {
              ...validData,
              lastName: "",
            },
            "lastName",
          ],
          [
            "Whitespace last name",
            {
              ...validData,
              lastName: "   ",
            },
            "lastName",
          ],
          [
            `Last name is longer than ${LastName.maxLength}`,
            {
              ...validData,
              lastName: faker.string.sample(LastName.maxLength + 1),
            },
            "lastName",
          ],
          [
            "Empty email",
            {
              ...validData,
              email: "",
            },
            "email",
          ],
          [
            "Whitespace email",
            {
              ...validData,
              email: "   ",
            },
            "email",
          ],
          [
            `Email is longer than ${Email.maxLength}`,
            {
              ...validData,
              email: `test${"t".repeat(Email.maxLength)}@gmail.com`,
            },
            "email",
          ],
          [
            "Empty password",
            {
              ...validData,
              password: "",
            },
            "password",
          ],
          [
            "Whitespace password",
            {
              ...validData,
              password: "   ",
            },
            "password",
          ],
          [
            `Password is shorter than ${Password.minLength}`,
            {
              ...validData,
              password: faker.internet.password({ length: Password.minLength - 1 }),
            },
            "password",
          ],
          [
            `Password is longer than ${Password.maxLength}`,
            {
              ...validData,
              password: faker.internet.password({ length: Password.maxLength + 1 }),
            },
            "password",
          ],
        ] as const;

        await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.signUp(body, signal);
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
        await Promise.allSettled(
          [...Array(app.config.rateLimit.signUp)].map(async () => {
            const response = await app.signUp({ ...validData, email: "invalid email" }, signal);

            expect(response.status).toBe(400);
          }),
        );

        const lastRes = await app.signUp({ ...validData, email: "invalid email" }, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
