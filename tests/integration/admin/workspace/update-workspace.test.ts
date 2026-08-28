import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { AdminWorkspaceDto } from "@/application/admin/workspace/dto/admin-workspace.dto.js";

describe("Admin/Workspaces", () => {
  describe("Update workspace", () => {
    const validData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: Password.maxLength - 1 }),
    };

    it("Should return 200 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const getWorkspacesResponse = await app.getWorkspaces({ limit: 10 }, cookies, signal);
        expect(getWorkspacesResponse.status).toBe(200);

        const data = (await getWorkspacesResponse.json()) as { data: AdminWorkspaceDto[] };
        const workspace = data.data[0];

        const newName = faker.string.alpha({ length: WorkspaceName.length });

        const response = await app.updateWorkspace(
          workspace.id,
          {
            name: newName,
          },
          cookies,
          signal,
        );
        expect(response.status).toBe(200);

        const workspaceFromDb = await app.getWorkspaceFromDbById(workspace.id);
        expect(workspaceFromDb).toBeDefined();
        expect(workspaceFromDb!.name).toBe(newName);
        expect(workspaceFromDb!.name).not.toBe(workspace.name);
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const invalidData = [
          [
            "Empty name",
            {
              name: "",
            },
            "name",
          ],
          [
            "Whitespace name",
            {
              name: "   ",
            },
            "name",
          ],
          [
            `Name is longer than ${WorkspaceName.maxLength}`,
            {
              name: faker.string.sample(WorkspaceName.maxLength + 1),
            },
            "name",
          ],
          [
            "Empty country",
            {
              country: "",
            },
            "country",
          ],
          [
            "Whitespace country",
            {
              country: "   ",
            },
            "country",
          ],
          [
            `Country is longer than ${WorkspaceAddress.countryMaxLength}`,
            {
              country: faker.string.sample(WorkspaceAddress.countryMaxLength + 1),
            },
            "country",
          ],
          [
            "Empty city",
            {
              city: "",
            },
            "city",
          ],
          [
            "Whitespace city",
            {
              city: "   ",
            },
            "city",
          ],
          [
            `City is longer than ${WorkspaceAddress.cityMaxLength}`,
            {
              city: faker.string.sample(WorkspaceAddress.cityMaxLength + 1),
            },
            "city",
          ],
          [
            "Empty street",
            {
              street: "",
            },
            "street",
          ],
          [
            "Whitespace street",
            {
              street: "   ",
            },
            "street",
          ],
          [
            `Street is longer than ${WorkspaceAddress.streetMaxLength}`,
            {
              street: faker.string.sample(WorkspaceAddress.streetMaxLength + 1),
            },
            "street",
          ],
          [
            "Empty street number",
            {
              streetNumber: "",
            },
            "streetNumber",
          ],
          [
            "Whitespace street number",
            {
              streetNumber: "   ",
            },
            "streetNumber",
          ],
          [
            `Street number is longer than ${WorkspaceAddress.streetNumberMaxLength}`,
            {
              streetNumber: faker.string.sample(WorkspaceAddress.streetNumberMaxLength + 1),
            },
            "streetNumber",
          ],
          [
            "Empty postal code",
            {
              postalCode: "",
            },
            "postalCode",
          ],
          [
            "Whitespace postal code",
            {
              postalCode: "   ",
            },
            "postalCode",
          ],
          [
            `Postal code is longer than ${WorkspaceAddress.postalCodeMaxLength}`,
            {
              postalCode: faker.string.sample(WorkspaceAddress.postalCodeMaxLength + 1),
            },
            "postalCode",
          ],
        ] as const;

        const results = await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.updateWorkspace(crypto.randomUUID(), body, cookies, signal);
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
        const response = await app.updateWorkspace(crypto.randomUUID(), {}, undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.updateWorkspace(crypto.randomUUID(), {}, cookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
