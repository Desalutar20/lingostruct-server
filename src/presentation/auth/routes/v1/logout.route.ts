import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { LogoutCommand } from "@/application/auth/use-cases/logout.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/logout",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.logout,
          timeWindow: "1 minute",
        },
      },
      preHandler: async (req, reply) => {
        const result = await req.authenticate();
        if (result.isErr()) {
          return mapAppErrorToHttpError(reply, result.error);
        }
      },
      schema: {
        tags: ["Authentication"],
        response: {
          200: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session || !req.sessionId) {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const command = new LogoutCommand(UUID.create(req.session.id)._unsafeUnwrap(), req.sessionId);

      const result = await fastify.useCases.auth.logout.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).clearCookie(fastify.applicationConfig.sessionCookieName).send({
        status: "success",
        data: "Logged out successfully.",
      });
    },
  );
};

export default plugin;
