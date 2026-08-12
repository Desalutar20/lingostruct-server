import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db);

  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("hashed_password", "text")
    .addColumn("role", "text", (col) => col.notNull().defaultTo("regular"))
    .addColumn("is_verified", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("is_banned", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("google_id", "text")
    .addColumn("github_id", "text")
    .addUniqueConstraint("uq_users_email", ["email"])
    .addUniqueConstraint("uq_users_google_id", ["google_id"])
    .addUniqueConstraint("uq_users_github_id", ["github_id"])
    .addCheckConstraint("ck_users_role", sql`role IN ('admin', 'regular')`)
    .execute();

  await db.schema
    .createTable("outbox")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("data", "jsonb", (col) => col.notNull())
    .addColumn("processed_at", "timestamptz")
    .addCheckConstraint("ck_outbox_type", sql`type in ('email')`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("outbox").execute();
  await db.schema.dropTable("users").execute();
  await sql`DROP EXTENSION IF EXISTS pgcrypto`.execute(db);
}
