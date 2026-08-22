import { SignUpCommand } from "@/application/auth/use-cases/sign-up.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "@/domain/user/first-name.js";
import { LastName } from "@/domain/user/last-name.js";
import { Password } from "@/domain/user/password.js";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { EmailSchema, NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";

const SignUpRequestSchema = z
  .object({
    firstName: NonEmptyStringSchema.max(FirstName.maxLength).transform(
      transformToValueObject(FirstName.create),
    ),
    lastName: NonEmptyStringSchema.max(LastName.maxLength).transform(
      transformToValueObject(LastName.create),
    ),
    email: EmailSchema.max(Email.maxLength).transform(transformToValueObject(Email.create)),
    password: NonEmptyStringSchema.min(Password.minLength)
      .max(Password.maxLength)
      .transform(transformToValueObject(Password.create)),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/sign-up",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.signUp,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        body: SignUpRequestSchema,
        response: {
          201: SuccessResponseSchema(z.string()),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new SignUpCommand(
        req.body.firstName,
        req.body.lastName,
        req.body.email,
        req.body.password,
      );

      const result = await fastify.useCases.auth.signUp.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(201).send({
        status: "success",
        data: "If this email is registered, we've sent a confirmation email to this address.",
      });
    },
  );
};

export default plugin;
