import { it, describe, expect } from "vitest";
import { TestApp } from "../../helpers/test-app.js";
import { faker } from "@faker-js/faker";
import { Password } from "@/domain/user/password.js";
import "../../helpers/requests/index.js";
import { UserRole } from "@/domain/user/user-role.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";

describe("Admin/Workspaces", () => {
  describe("Create workspace", () => {
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

    it("Should return 201 status code when request is successful", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const response = await app.createWorkspace(validWorkspaceData, cookies, signal);
        expect(response.status).toBe(201);

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

        //@ts-ignore
        const workspaceFromDb = await app.getWorkspaceFromDbById(data.data.id);
        expect(workspaceFromDb).toBeDefined();
      });
    });

    it("Should return 400 status code when data is invalid", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal, UserRole.Admin);

        const invalidData = [
          [
            "Empty name",
            {
              ...validWorkspaceData,
              name: "",
            },
            "name",
          ],
          [
            "Whitespace name",
            {
              ...validWorkspaceData,
              name: "   ",
            },
            "name",
          ],
          [
            `Name is longer than ${WorkspaceName.maxLength}`,
            {
              ...validWorkspaceData,
              name: faker.string.sample(WorkspaceName.maxLength + 1),
            },
            "name",
          ],
          [
            "Empty country",
            {
              ...validWorkspaceData,
              country: "",
            },
            "country",
          ],
          [
            "Whitespace country",
            {
              ...validWorkspaceData,
              country: "   ",
            },
            "country",
          ],
          [
            `Country is longer than ${WorkspaceAddress.countryMaxLength}`,
            {
              ...validWorkspaceData,
              country: faker.string.sample(WorkspaceAddress.countryMaxLength + 1),
            },
            "country",
          ],
          [
            "Empty city",
            {
              ...validWorkspaceData,
              city: "",
            },
            "city",
          ],
          [
            "Whitespace city",
            {
              ...validWorkspaceData,
              city: "   ",
            },
            "city",
          ],
          [
            `City is longer than ${WorkspaceAddress.cityMaxLength}`,
            {
              ...validWorkspaceData,
              city: faker.string.sample(WorkspaceAddress.cityMaxLength + 1),
            },
            "city",
          ],
          [
            "Empty street",
            {
              ...validWorkspaceData,
              street: "",
            },
            "street",
          ],
          [
            "Whitespace street",
            {
              ...validWorkspaceData,
              street: "   ",
            },
            "street",
          ],
          [
            `Street is longer than ${WorkspaceAddress.streetMaxLength}`,
            {
              ...validWorkspaceData,
              street: faker.string.sample(WorkspaceAddress.streetMaxLength + 1),
            },
            "street",
          ],
          [
            "Empty street number",
            {
              ...validWorkspaceData,
              streetNumber: "",
            },
            "streetNumber",
          ],
          [
            "Whitespace street number",
            {
              ...validWorkspaceData,
              streetNumber: "   ",
            },
            "streetNumber",
          ],
          [
            `Street number is longer than ${WorkspaceAddress.streetNumberMaxLength}`,
            {
              ...validWorkspaceData,
              streetNumber: faker.string.sample(WorkspaceAddress.streetNumberMaxLength + 1),
            },
            "streetNumber",
          ],
          [
            "Empty postal code",
            {
              ...validWorkspaceData,
              postalCode: "",
            },
            "postalCode",
          ],
          [
            "Whitespace postal code",
            {
              ...validWorkspaceData,
              postalCode: "   ",
            },
            "postalCode",
          ],
          [
            `Postal code is longer than ${WorkspaceAddress.postalCodeMaxLength}`,
            {
              ...validWorkspaceData,
              postalCode: faker.string.sample(WorkspaceAddress.postalCodeMaxLength + 1),
            },
            "postalCode",
          ],
        ] as const;

        const results = await Promise.allSettled(
          invalidData.map(async ([description, body, field]) => {
            const response = await app.createWorkspace(body, cookies, signal);
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
        const response = await app.createWorkspace(validWorkspaceData, undefined, signal);
        expect(response.status).toBe(401);
      });
    });

    it("Should return 403 status code when user is not admin", async ({ signal }) => {
      await TestApp.run(async (app) => {
        const { cookies } = await app.signUpAndSignIn(validData, signal);

        const response = await app.createWorkspace(validWorkspaceData, cookies, signal);
        expect(response.status).toBe(403);
      });
    });
  });
});
