import { it, describe, expect } from "vitest";
import { TestApp } from "../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";

describe("Workspaces", () => {
  describe("Get Workspace", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    const validWorkspaceData = {
      name: faker.string.alpha({ length: WorkspaceName.length }),
      country: faker.string.alpha({ length: WorkspaceAddress.countryMaxLength }),
      city: faker.string.alpha({ length: WorkspaceAddress.cityMaxLength }),
      street: faker.string.alpha({ length: WorkspaceAddress.streetMaxLength }),
      streetNumber: faker.string.alpha({ length: WorkspaceAddress.streetNumberMaxLength }),
      postalCode: faker.string.alpha({ length: WorkspaceAddress.postalCodeMaxLength }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const getWorkspacesResponse = await app.getWorkspaces({}, cookies, signal);
        expect(getWorkspacesResponse.status).toBe(200);

        const workspacesData = (await getWorkspacesResponse.json()) as {
          data: AdminWorkspaceDto[];
        };
        const workspace = workspacesData.data[0];
        expect(workspace).toBeDefined();

        const response = await app.getWorkspace(workspace!.id, cookies);
        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data).toMatchObject({
          status: "success",
          data: {
            id: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            name: expect.any(String),
            country: expect.any(String),
            city: expect.any(String),
            street: expect.any(String),
            streetNumber: expect.any(String),
            postalCode: expect.any(String),
          },
        });
      });
    });

    //TODO
    // it("Should return 200 status code when user is a workspace member", async ({ signal }) => {
    //   await TestApp.run(async (app) => {
    //     const { cookies, session } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

    //     const createWorkspaceResponse = await app.createWorkspace(
    //       validWorkspaceData,
    //       cookies,
    //       signal,
    //     );
    //     expect(createWorkspaceResponse.status).toBe(201);

    //     const workspaceData = (await createWorkspaceResponse.json()) as {
    //       data: AdminWorkspaceDto;
    //     };

    //     await app.createWorkspaceUser(
    //       {
    //         workspaceId: workspaceData.data.id,
    //         userId: user.id,
    //         role: "member",
    //       },
    //       cookies,
    //       signal,
    //     );
    //   });
    // });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const response = await app.getWorkspace("not uuid", undefined, signal);
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
        const response = await app.getWorkspace(crypto.randomUUID(), undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.getWorkspace(crypto.randomUUID(), cookies, signal);
        expect(response.status).toBe(403);
      });
    });

    it("Should return 403 status code when user is not a member of the workspace", async ({
      signal,
    }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const createWorkspaceResponse = await app.createWorkspace(
          validWorkspaceData,
          cookies,
          signal,
        );
        expect(createWorkspaceResponse.status).toBe(201);
        const data = (await createWorkspaceResponse.json()) as { data: AdminWorkspaceDto };

        const { cookies: memberCookies } = await app.signUpAndSignIn({
          ...validData,
          email: faker.internet.email(),
        });

        const response = await app.getWorkspace(data.data.id, memberCookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
