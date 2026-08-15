import fastifyCookie, { type FastifyCookieOptions } from "@fastify/cookie";
import type { FastifyInstance } from "fastify/types/instance.js";
import fp from "fastify-plugin";

export const autoConfig = (fastify: FastifyInstance): FastifyCookieOptions => ({
  secret: fastify.applicationConfig.cookieSecret,
  parseOptions: {
    path: "/",
    httpOnly: true,
    signed: true,
    secure: fastify.applicationConfig.cookieSecure,
    sameSite: "strict",
  },
});

export default fp(fastifyCookie, { name: "cookie" });
