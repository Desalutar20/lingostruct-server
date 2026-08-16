import { DatabaseConfig } from "@/application/config/database.config.js";
import { DB } from "@/infrastructure/data/db.types.js";
import { CamelCasePlugin, Kysely, PostgresDialect, SafeNullComparisonPlugin } from "kysely";
import cp from "node:child_process";
import { promisify } from "node:util";
import { Client, Pool } from "pg";

const exec = promisify(cp.exec);

export const setupTestDatabase = async (config: DatabaseConfig) => {
  const client = new Client({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
  });

  await client.connect();
  await client.query(`CREATE DATABASE "${config.database}";`);

  const isWindows = process.platform === `win32`;
  const npm = isWindows ? `npm.cmd` : `npm`;

  await exec(`${npm} run migration:run -s`, {
    env: {
      ...process.env,
      DATABASE_URL: `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
    },
  });

  const kysely = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        database: config.database,
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
      }),
    }),
    plugins: [new CamelCasePlugin(), new SafeNullComparisonPlugin()],
  });

  return {
    kysely,
    async cleanDatabase() {
      await kysely.destroy();

      await client.query(`DROP DATABASE "${config.database}";`);
      await client.end();
    },
  };
};
