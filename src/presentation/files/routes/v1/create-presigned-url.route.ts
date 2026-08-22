import {
  ErrorResponseSchema,
  SuccessResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { CreatePresignedUrlCommand } from "@/application/object-storage/use-cases/create-presigned-url.js";
import { MimeType } from "@/domain/shared/value-objects/mime-type.js";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";

const CreatePresignedUrlQuerySchema = z
  .object({
    contentType: z.string().trim().nonempty().transform(transformToValueObject(MimeType.create)),
  })
  .strict();

const CreatePresignedUrlResponseSchema = z
  .object({
    url: z.url().trim().nonempty(),
    key: z.string().trim().nonempty(),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/files/presigned-url",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.createPresignedUrl,
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
        tags: ["Files"],
        querystring: CreatePresignedUrlQuerySchema,
        response: {
          200: SuccessResponseSchema(CreatePresignedUrlResponseSchema),
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      if (!req.session) {
        return mapAppErrorToHttpError(reply, unauthorized());
      }

      const result = await fastify.useCases.files.createPresignedUrl.handle(
        new CreatePresignedUrlCommand(req.query.contentType),
      );

      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      reply.status(200).send({
        status: "success",
        data: {
          url: result.value.url.value,
          key: result.value.key.value,
        },
      });
    },
  );
};

export default plugin;
