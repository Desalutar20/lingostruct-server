import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import {
  GET_USERS_MAX_LIMIT,
  GET_USERS_SEARCH_MAX_LENGTH,
} from "@/application/admin/users/const/admin-users.const.js";
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
          [
            "Empty search",
            {
              search: "",
            },
            "search",
          ],
          [
            "Whitespace search",
            {
              search: "   ",
            },
            "search",
          ],
          [
            `Search is longer than ${GET_USERS_SEARCH_MAX_LENGTH}`,
            {
              search: "t".repeat(GET_USERS_SEARCH_MAX_LENGTH + 1),
            },
            "search",
          ],
          [
            "Invalid isBanned value",
            {
              isBanned: "not bool",
            },
            "isBanned",
          ],
          [
            "Invalid isVerified value",
            {
              isVerified: "not bool",
            },
            "isVerified",
          ],
          [
            "Limit is negative",
            {
              limit: -1,
            },
            "limit",
          ],
          [
            "Limit is zero",
            {
              limit: 0,
            },
            "limit",
          ],
          [
            `Limit is greater than ${GET_USERS_MAX_LIMIT}`,
            {
              limit: GET_USERS_MAX_LIMIT + 1,
            },
            "limit",
          ],
          [
            "Empty prev cursor",
            {
              prevCursor: "",
            },
            "prevCursor",
          ],
          [
            "Whitespace prev cursor",
            {
              prevCursor: "   ",
            },
            "prevCursor",
          ],
          [
            "Empty next cursor",
            {
              nextCursor: "",
            },
            "nextCursor",
          ],
          [
            "Whitespace next cursor",
            {
              nextCursor: "   ",
            },
            "nextCursor",
          ],
          [
            "Both cursors are provided",
            {
              prevCursor: "prev",
              nextCursor: "next",
            },
            "cursor",
          ],
        ] as const;

        await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.getUsers(body, undefined, signal);
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
