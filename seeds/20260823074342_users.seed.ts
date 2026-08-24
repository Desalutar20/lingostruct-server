import { faker } from "@faker-js/faker";
import type { Kysely } from "kysely";
import { DB } from "@/infrastructure/data/db.types.js";
import { HashedPassword } from "@/domain/user/hashed-password.js";

export async function seed(db: Kysely<DB>): Promise<void> {
  await db
    .insertInto("users")
    .values([
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
        isBanned: true,
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
        isVerified: true,
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
        isBanned: true,
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
        isVerified: true,
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
      },
      {
        email: faker.internet.email(),
        hashedPassword: faker.internet.password({ length: HashedPassword.minLength }),
      },
    ])
    .execute();
}
