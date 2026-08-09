import { Selectable } from "kysely";
import { Users } from "@/infrastructure/data/db.types.js";
import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getUserFromDbByEmail(email: string): Promise<Selectable<Users> | undefined>;
  }
}

TestApp.prototype.getUserFromDbByEmail = async function (email: string) {
  return await this.db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
};
