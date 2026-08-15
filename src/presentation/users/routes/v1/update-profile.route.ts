import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { FirstName } from "@/domain/users/first-name.js";
import { transformToValueObjectOptional } from "@/presentation/shared/schemas/transform-value-object.js";
import { LastName } from "@/domain/users/last-name.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { UserId } from "@/domain/users/user-id.js";
import { UpdateProfileCommand } from "@/application/users/use-cases/update-profile.js";

const UpdateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .nonempty()
    .max(FirstName.maxLength)
    .optional()
    .transform(transformToValueObjectOptional(FirstName.create)),
  lastName: z
    .string()
    .trim()
    .nonempty()
    .max(LastName.maxLength)
    .optional()
    .transform(transformToValueObjectOptional(LastName.create)),
  avatarUrl: z
    .url()
    .trim()
    .nonempty()
    .optional()
    .transform(transformToValueObjectOptional(URL.create)),
});
// .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.patch(
    "/users/me",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.updateProfile,
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
        body: UpdateProfileSchema,
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

      const result = await fastify.useCases.users.updateProfile.handle(
        new UpdateProfileCommand(
          UserId.create(req.session.id)._unsafeUnwrap(),
          req.body.firstName ?? null,
          req.body.lastName ?? null,
          req.body.avatarUrl ?? null,
        ),
      );
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: "Profile updated successfully",
      });
    },
  );
};

export default plugin;
