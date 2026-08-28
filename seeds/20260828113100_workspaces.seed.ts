import { WorkspaceAddress } from "@/domain/workspace/workspace-address.js";
import { WorkspaceName } from "@/domain/workspace/workspace-name.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";

// replace `any` with your database interface.
export async function seed(db: Kysely<DB>): Promise<void> {
  await db
    .insertInto("workspace")
    .values(
      Array.from({ length: 100 }, () => ({
        id: faker.string.uuid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: faker.string.alpha({ length: WorkspaceName.length }),
        country: faker.string.alpha({ length: WorkspaceAddress.countryMaxLength }),
        city: faker.string.alpha({ length: WorkspaceAddress.cityMaxLength }),
        street: faker.string.alpha({ length: WorkspaceAddress.streetMaxLength }),
        streetNumber: faker.string.alpha({ length: WorkspaceAddress.streetNumberMaxLength }),
        postalCode: faker.string.alpha({ length: WorkspaceAddress.postalCodeMaxLength }),
      })),
    )
    .execute();
}
