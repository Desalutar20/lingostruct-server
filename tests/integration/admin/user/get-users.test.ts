import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";

describe("Admin/Users", () => {
  describe("Get Users", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const response = await app.getUsers({}, cookies, signal);
        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data).toMatchObject({
          status: "success",
          data: expect.arrayContaining([
            {
              id: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              email: expect.any(String),
              firstName: expect.any(String),
              lastName: expect.any(String),
              role: expect.any(String),
              isBanned: expect.any(Boolean),
              isVerified: expect.any(Boolean),
              googleId: null,
              githubId: null,
              avatarId: null,
            },
          ]),
          prevCursor: null,
          nextCursor: null,
        });
      });
    });

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.getUsers(undefined, undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.getUsers(undefined, cookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
