import cors, { type FastifyCorsOptions } from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance): FastifyCorsOptions => {
  return {
    origin: [fastify.applicationConfig.clientUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTION"],
  };
};

export default cors;
