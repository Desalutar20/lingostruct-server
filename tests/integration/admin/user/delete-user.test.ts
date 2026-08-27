import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";

describe("Admin/Users", () => {
  describe("Delete user", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const getUsersResponse = await app.getUsers({}, cookies, signal);
        expect(getUsersResponse.status).toBe(200);

        const data = (await getUsersResponse.json()) as { data: AdminUserDto[] };
        const user = data.data[0];

        expect(user).toBeDefined();

        const response = await app.deleteUser(user.id, cookies, signal);
        expect(response.status).toBe(200);

        const userFromDb = await app.getUserFromDbByEmail(user.email);

        expect(userFromDb).toBeUndefined();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.deleteUser("not uuid", undefined, signal);
        expect(response.status).toBe(400);

        const data = await response.json();

        expect(data).toMatchObject({
          errors: {
            userId: [expect.any(String)],
          },
        });
      });
    });

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.deleteUser(crypto.randomUUID(), undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.deleteUser(crypto.randomUUID(), cookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
