import { SignUpCommand } from "@/application/auth/use-cases/sign-up.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { FirstName } from "@/domain/users/first-name.js";
import { LastName } from "@/domain/users/last-name.js";
import { Password } from "@/domain/users/password.js";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";

const SignUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .nonempty()
    .max(FirstName.maxLength)
    .transform(transformToValueObject(FirstName.create)),
  lastName: z
    .string()
    .trim()
    .nonempty()
    .max(LastName.maxLength)
    .transform(transformToValueObject(LastName.create)),
  email: z
    .email()
    .trim()
    .nonempty()
    .max(Email.maxLength)
    .transform(transformToValueObject(Email.create)),
  password: z
    .string()
    .trim()
    .nonempty()
    .min(Password.minLength)
    .max(Password.maxLength)
    .transform(transformToValueObject(Password.create)),
});

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
        body: SignUpSchema,
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
        return reply.status(400).send({ status: "error", error: "err" });
      }

      reply.status(201).send({
        status: "success",
        data: "If this email is registered, we've sent a confirmation email to this address.",
      });
    },
  );
};

export default plugin;
