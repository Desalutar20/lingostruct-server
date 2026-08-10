import { Selectable } from "kysely";
import { Users } from "@/infrastructure/data/db.types.js";
import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getUserFromDbByEmail(email: string): Promise<Selectable<Users> | undefined>;
    deleteUserFromDbByEmail(email: string): Promise<void>;
    banUserInDbByEmail(email: string): Promise<void>;
  }
}

TestApp.prototype.getUserFromDbByEmail = async function (email: string) {
  return await this.db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
};

TestApp.prototype.deleteUserFromDbByEmail = async function (email: string) {
  await this.db.deleteFrom("users").where("email", "=", email).executeTakeFirst();
};

TestApp.prototype.banUserInDbByEmail = async function (email: string) {
  await this.db
    .updateTable("users")
    .set("isBanned", true)
    .where("email", "=", email)
    .executeTakeFirst();
};
