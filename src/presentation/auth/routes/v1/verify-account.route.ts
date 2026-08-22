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
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { VerifyAccountCommand } from "@/application/auth/use-cases/verify-account.js";
import { EmailSchema, NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";

const VerifyAccountRequestSchema = z
  .object({
    email: EmailSchema.max(Email.maxLength).transform(transformToValueObject(Email.create)),
    token: NonEmptyStringSchema.max(200).transform(
      transformToValueObject((val) =>
        NonEmptyString.create(val, "token", "Token", { maxLength: 200 }),
      ),
    ),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/verify-account",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.verifyAccount,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        body: VerifyAccountRequestSchema,
        response: {
          200: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new VerifyAccountCommand(req.body.email, req.body.token);

      const result = await fastify.useCases.auth.verifyAccount.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: "Account verified successfully",
      });
    },
  );
};

export default plugin;
