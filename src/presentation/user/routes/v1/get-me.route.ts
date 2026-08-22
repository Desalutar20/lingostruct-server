import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { SessionSchema } from "@/presentation/shared/schemas/session.schema.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/users/me",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.getMe,
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
        tags: ["Users"],
        response: {
          200: SuccessResponseSchema(SessionSchema),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session) {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      reply.status(200).send({
        status: "success",
        data: req.session,
      });
    },
  );
};

export default plugin;
