import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";
import { FirstName } from "@/domain/user/first-name.js";
import { LastName } from "@/domain/user/last-name.js";

describe("Users", () => {
  describe("Update Profile", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.updateProfile(
          { firstName: faker.person.firstName() },
          cookies,
          signal,
        );
        expect(response.status).toBe(200);
      });
    });

    it("Should update user data in the database", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const firstName = faker.person.firstName();
        const response = await app.updateProfile({ firstName }, cookies, signal);

        expect(response.status).toBe(200);

        const userFromDb = await app.getUserFromDbByEmail(validData.email);
        expect(userFromDb).toBeDefined();
        expect(userFromDb!.firstName).toBe(firstName);
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const invalidData = [
          [
            "Empty first name",
            {
              firstName: "",
            },
            "firstName",
          ],
          [
            "Whitespace first name",
            {
              firstName: "   ",
            },
            "firstName",
          ],
          [
            `First name is longer than ${FirstName.maxLength}`,
            {
              firstName: faker.string.sample(FirstName.maxLength + 1),
            },
            "firstName",
          ],
          [
            "Empty last name",
            {
              lastName: "",
            },
            "lastName",
          ],
          [
            "Whitespace last name",
            {
              lastName: "   ",
            },
            "lastName",
          ],
          [
            `Last name is longer than ${LastName.maxLength}`,
            {
              lastName: faker.string.sample(LastName.maxLength + 1),
            },
            "lastName",
          ],
          [
            "Empty avatar url",
            {
              avatarUrl: "",
            },
            "avatarUrl",
          ],
          [
            "Whitespace avatar url",
            {
              avatarUrl: "   ",
            },
            "avatarUrl",
          ],
          [
            "Invalid avatar url",
            {
              avatarId: "not valid url",
            },
            "avatarUrl",
          ],
        ] as const;

        await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.updateProfile(body, cookies, signal);
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

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.updateProfile({}, undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 429 status code when rate limit is exceeded", async ({ signal }) => {
      await TestApp.run(async (app) => {
        await Promise.allSettled(
          [...Array(app.config.rateLimit.updateProfile)].map(async () => {
            const response = await app.updateProfile({}, undefined, signal);

            expect(response.status).toBe(401);
          }),
        );

        const lastRes = await app.updateProfile({}, undefined, signal);
        expect(lastRes.status).toBe(429);
      });
    });
  });
});
