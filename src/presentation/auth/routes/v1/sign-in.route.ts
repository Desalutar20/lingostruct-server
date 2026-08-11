import { SessionUser } from "@/application/auth/types/session-user.js";
import { SignInCommand } from "@/application/auth/use-cases/sign-in.js";
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

const SignInRequestSchema = z.object({
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

const SignInResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.literal(["admin", "regular"]),
}) satisfies z.ZodType<SessionUser>;

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    "/auth/sign-in",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.signIn,
          timeWindow: "1 minute",
        },
      },
      schema: {
        body: SignInRequestSchema,

        response: {
          200: SuccessResponseSchema(SignInResponseSchema),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new SignInCommand(req.body.email, req.body.password);

      const result = await fastify.useCases.auth.signIn.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply
        .cookie(fastify.applicationConfig.sessionCookieName, result.value[1].value, {
          maxAge: fastify.applicationConfig.sessionTTLMinutes * 60,
        })
        .status(200)
        .send({
          status: "success",
          data: result.value[0],
        });
    },
  );
};

export default plugin;
