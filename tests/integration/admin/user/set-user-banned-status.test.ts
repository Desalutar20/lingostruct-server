import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { AdminUserDto } from "@/application/admin/users/dto/admin-user.dto.js";

describe("Admin/Users", () => {
  describe("Set user banned status", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const getUsersResponse = await app.getUsers({ isBanned: false }, cookies, signal);
        expect(getUsersResponse.status).toBe(200);

        const data = (await getUsersResponse.json()) as { data: AdminUserDto[] };
        const user = data.data[0];

        expect(user).toBeDefined();

        const response = await app.setUserBannedStatus(
          user.id,
          {
            isBanned: true,
          },
          cookies,
          signal,
        );
        expect(response.status).toBe(200);

        const userFromDb = await app.getUserFromDbByEmail(user.email);

        expect(userFromDb).toBeDefined();
        expect(userFromDb!.isBanned).toBeTruthy();
        expect(user.isBanned).not.toBe(userFromDb!.isBanned);
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const invalidData = [
          ["Invalid id", { userId: "not uuid", isBanned: true }, "userId"],
          [
            "Invalid isBanned value",
            {
              userId: crypto.randomUUID(),
              isBanned: "not bool",
            },
            "isBanned",
          ],
        ] as const;

        const results = await Promise.allSettled(
          invalidData.map(async ([description, { userId, ...body }, field]) => {
            const response = await app.setUserBannedStatus(userId, body, undefined, signal);
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

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.setUserBannedStatus(
          crypto.randomUUID(),
          { isBanned: true },
          undefined,
          signal,
        );
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.setUserBannedStatus(
          crypto.randomUUID(),
          { isBanned: true },
          cookies,
          signal,
        );
        expect(response.status).toBe(403);
      });
    });
  });
});
