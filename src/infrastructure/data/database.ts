import { CamelCasePlugin, Kysely, PostgresDialect, SafeNullComparisonPlugin } from "kysely";
import { DatabaseConfig } from "../../application/config/database.config.js";
import { Pool } from "pg";
import { DB } from "./db.types.js";

export class Database extends Kysely<DB> {
  constructor(config: DatabaseConfig) {
    const dialect = new PostgresDialect({
      pool: new Pool({
        database: config.database,
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
        //TODO
        max: 100,
      }),
    });

    super({ dialect, plugins: [new CamelCasePlugin(), new SafeNullComparisonPlugin()] });
  }
}
