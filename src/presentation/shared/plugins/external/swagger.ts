import fastifySwagger from "@fastify/swagger";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";
import fastifySwaggerUi from "@fastify/swagger-ui";

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifySwagger, {
    hideUntagged: true,
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Lingostruct API",
        version: "0.1.0",
      },
      servers: [
        {
          url: "http://localhost:4000",
          description: "Development server",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
  });
});
