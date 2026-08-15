import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { transformToValueObjectOptional } from "@/presentation/shared/schemas/transform-value-object.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { GenerateOAuthUrlCommand } from "@/application/auth/use-cases/generate-oauth-url.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import z from "zod";
import { OAuthProvider } from "@/domain/users/oauth-provider.js";

const GenerateOAuthUrlRequestQuerySchema = z
  .object({
    redirectPath: z
      .string()
      .trim()
      .optional()
      .transform(transformToValueObjectOptional(NonEmptyString.create)),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/auth/google",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.signIn,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        querystring: GenerateOAuthUrlRequestQuerySchema,
        response: {
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new GenerateOAuthUrlCommand(OAuthProvider.Google, req.query.redirectPath);

      const result = await fastify.useCases.auth.generateOAuthUrl.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      const [url, state] = result.value;

      reply
        .setCookie(fastify.applicationConfig.oauthStateCookieName, state.toString(), {
          maxAge: 60 * fastify.applicationConfig.oauthStateTTLMinutes,
          sameSite: "lax",
        })
        .redirect(url.toString());
    },
  );

  fastify.get(
    "/auth/github",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.signIn,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        querystring: GenerateOAuthUrlRequestQuerySchema,
        response: {
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const command = new GenerateOAuthUrlCommand(OAuthProvider.Github, req.query.redirectPath);

      const result = await fastify.useCases.auth.generateOAuthUrl.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      const [url, state] = result.value;

      reply
        .setCookie(fastify.applicationConfig.oauthStateCookieName, state.toString(), {
          maxAge: 60 * fastify.applicationConfig.oauthStateTTLMinutes,
          sameSite: "lax",
        })
        .redirect(url.toString());
    },
  );
};

export default plugin;
