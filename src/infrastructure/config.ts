import { z } from "zod";
import { ApplicationConfig, Config, DatabaseConfig } from "../application/config/index.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import { readFileSync } from "node:fs";

const applicationConfigSchema = z.object({
  port: z.number().min(1).max(65535),
});

const databaseConfigSchema = z.object({
  host: z.string().nonempty(),
  port: z.number().min(1).max(65535),
  password: z.string().nonempty(),
  database: z.string().nonempty(),
  ssl: z.stringbool(),
});

const configSchema = z.object({
  application: applicationConfigSchema,
  database: databaseConfigSchema,
});

export const loadConfig = (): Config => {
  const env = process.env.NODE_ENV;
  const fileName = `config${env ? `-${env}` : ""}.yaml`;

  const configPath = join(dirname(fileURLToPath(import.meta.url)), `../../config/${fileName}`);
  const doc = load(readFileSync(configPath, "utf8"));

  const parsed = configSchema.safeParse(doc);
  if (!parsed.success) {
    console.error("❌ Configuration validation failed:");

    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path}: ${issue.message}`;
    });

    console.error(errors.join("\n"));

    throw new Error("Invalid configuration");
  }

  return new Config(
    new ApplicationConfig(parsed.data.application),
    new DatabaseConfig(parsed.data.database),
  );
};
