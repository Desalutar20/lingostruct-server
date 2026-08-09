import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    fileParallelism: true,
    globals: true,
    server: {
      deps: {
        inline: ["@fastify/autoload"],
      },
    },
    root: "./tests",
    isolate: false,
    testTimeout: 300000,
    hookTimeout: 100000,
    maxConcurrency: 15,
    maxWorkers: 5,
    sequence: {
      concurrent: true,
    },
  },
});
