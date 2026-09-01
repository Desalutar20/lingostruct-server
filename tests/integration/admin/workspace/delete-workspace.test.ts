import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";

describe("Admin/Workspaces", () => {
  describe("Delete workspace", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const getWorkspacesResponse = await app.getWorkspaces({}, cookies, signal);
        expect(getWorkspacesResponse.status).toBe(200);

        const data = (await getWorkspacesResponse.json()) as { data: AdminWorkspaceDto[] };
        const workspace = data.data[0];

        expect(workspace).toBeDefined();

        const response = await app.deleteWorkspace(workspace.id, cookies, signal);
        expect(response.status).toBe(200);

        const workspaceFromDb = await app.getWorkspaceFromDbById(workspace.id);
        expect(workspaceFromDb).toBeUndefined();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.deleteWorkspace("not uuid", undefined, signal);
        expect(response.status).toBe(400);

        const data = await response.json();

        expect(data).toMatchObject({
          errors: {
            id: [expect.any(String)],
          },
        });
      });
    });

    it("Should return 401 status code when user is not logged in", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.deleteWorkspace(crypto.randomUUID(), undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.deleteWorkspace(crypto.randomUUID(), cookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
