import { Email } from "@/domain/shared/value-objects/email.js";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { ForgotPasswordCommand } from "@/application/auth/use-cases/forgot-password.js";
import { EmailSchema } from "@/presentation/shared/schemas/common.schema.js";

const ForgotPasswordRequestSchema = z
  .object({
    email: EmailSchema.max(Email.maxLength).transform(transformToValueObject(Email.create)),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/forgot-password",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.forgotPassword,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        body: ForgotPasswordRequestSchema,
        response: {
          200: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new ForgotPasswordCommand(req.body.email);

      const result = await fastify.useCases.auth.forgotPassword.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: "If an account with this email exists, you will receive a password reset link.",
      });
    },
  );
};

export default plugin;
