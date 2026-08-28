import { Selectable } from "kysely";
import { Users, Workspace } from "@/infrastructure/data/db.types.js";
import { TestApp } from "../test-app.js";

declare module "../test-app.js" {
  interface TestApp {
    getUserFromDbByEmail(email: string): Promise<Selectable<Users> | undefined>;
    deleteUserFromDbByEmail(email: string): Promise<void>;
    banUserInDbByEmail(email: string): Promise<void>;
    unVerifyUserInDbByEmail(email: string): Promise<void>;
    getWorkspaceFromDbById(id: string): Promise<Selectable<Workspace> | undefined>;
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

TestApp.prototype.unVerifyUserInDbByEmail = async function (email: string) {
  await this.db
    .updateTable("users")
    .set("isVerified", false)
    .where("email", "=", email)
    .executeTakeFirst();
};

TestApp.prototype.getWorkspaceFromDbById = async function (id: string) {
  return await this.db.selectFrom("workspace").selectAll().where("id", "=", id).executeTakeFirst();
};
