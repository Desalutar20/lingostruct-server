import Fastify from "fastify";
import { Config } from "../application/config/index.js";
import crypto from "node:crypto";

export const createServer = async (config: Config) => {
  const app = Fastify({
    logger: true,
    genReqId: () => crypto.randomUUID(),
  });

  app.get("/", async function handler(request, reply) {
    return { hello: "world" };
  });

  await app.ready();

  return app;
};
