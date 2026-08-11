import { Email } from "@/domain/shared/value-objects/email.js";
import { Password } from "@/domain/users/password.js";
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
import { ResetPasswordCommand } from "@/application/auth/use-cases/reset-password.js";

const ResetPasswordRequestSchema = z.object({
  email: z
    .email()
    .trim()
    .nonempty()
    .max(Email.maxLength)
    .transform(transformToValueObject(Email.create)),

  token: z
    .string()
    .trim()
    .nonempty()
    .max(200)
    .transform(
      transformToValueObject((val) =>
        NonEmptyString.create(val, "token", "Token", { maxLength: 200 }),
      ),
    ),
  newPassword: z
    .string()
    .trim()
    .nonempty()
    .min(Password.minLength)
    .max(Password.maxLength)
    .transform(transformToValueObject(Password.create)),
});

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/reset-password",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.resetPassword,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        body: ResetPasswordRequestSchema,
        response: {
          200: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new ResetPasswordCommand(
        req.body.email,
        req.body.token,
        req.body.newPassword,
      );

      const result = await fastify.useCases.auth.resetPassword.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply

        .status(200)
        .send({
          status: "success",
          data: "Password has been reset successfully.",
        });
    },
  );
};

export default plugin;
