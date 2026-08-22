import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "@/presentation/shared/schemas/response.schema.js";
import { mapAppErrorToHttpError } from "@/presentation/shared/helpers/error-handler.js";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { transformToValueObject } from "@/presentation/shared/schemas/transform-value-object.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { OAuthSignInCommand } from "@/application/auth/use-cases/oauth-sign-in.js";
import { OAuthProvider } from "@/domain/user/oauth-provider.js";
import { failure } from "@/domain/abstractions/errors.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";
import { NonEmptyStringSchema } from "@/presentation/shared/schemas/common.schema.js";

const OAuthSignInRequestQuerySchema = z.object({
  code: NonEmptyStringSchema.transform(transformToValueObject(NonEmptyString.create)),
  state: NonEmptyStringSchema.transform(transformToValueObject(OAuthState.create)),
});

export const OAuthRequestParamsSchema = z
  .object({
    provider: z
      .literal(["google", "github"])
      .transform(transformToValueObject(OAuthProvider.create)),
  })
  .strict();

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/auth/:provider/callback",
    {
      config: {
        rateLimit: {
          max: fastify.rateLimitConfig.signIn,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Authentication"],
        querystring: OAuthSignInRequestQuerySchema,
        params: OAuthRequestParamsSchema,
        response: {
          400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
        },
      },
    },
    async (req, reply) => {
      const cookieState = req.cookies[fastify.applicationConfig.oauthStateCookieName];
      if (!cookieState) {
        return mapAppErrorToHttpError(reply, failure("Invalid state", "OPERATION_FAILED"));
      }

      const unsigned = req.unsignCookie(cookieState);
      if (!unsigned.valid) {
        return mapAppErrorToHttpError(reply, failure("Invalid state", "OPERATION_FAILED"));
      }

      const state = OAuthState.create(unsigned.value);
      if (state.isErr()) {
        return mapAppErrorToHttpError(reply, failure("Invalid state", "OPERATION_FAILED"));
      }

      const command = new OAuthSignInCommand(
        req.params.provider,
        req.query.code,
        req.query.state,
        state.value,
      );

      const result = await fastify.useCases.auth.oauthSignIn.handle(command);
      if (result.isErr()) {
        return mapAppErrorToHttpError(reply, result.error);
      }

      const redirectUrl = `${fastify.applicationConfig.clientUrl}${state.value.additionalState ? `?${state.value.additionalState}` : ""}`;

      reply
        .cookie(fastify.applicationConfig.sessionCookieName, result.value.value, {
          maxAge: fastify.applicationConfig.sessionTTLMinutes * 60,
        })
        .redirect(redirectUrl);
    },
  );
};

export default plugin;
