import { type FastifyInstance, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { Session } from "@/application/abstractions/auth/session.type.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { errAsync } from "neverthrow";
import { unauthorized } from "@/domain/abstractions/errors.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { AuthenticateCommand } from "@/application/auth/use-cases/authenticate.js";

declare module "fastify" {
  export interface FastifyRequest {
    authenticate: ReturnType<typeof authenticate>;
    session: Session | null;
    sessionId: UUID | null;
  }
}

function authenticate(instance: FastifyInstance) {
  return function (this: FastifyRequest): ResultAsync<void> {
    const session = this.cookies[instance.applicationConfig.sessionCookieName];
    if (!session) {
      this.log.info("Authentication failed: session not found");
      return errAsync(unauthorized());
    }

    const unsigned = this.unsignCookie(session);
    if (!unsigned.valid) {
      this.log.info("Authentication failed: session isn't valid");
      return errAsync(unauthorized());
    }

    const result = UUID.create(unsigned.value);
    if (result.isErr()) {
      this.log.info("Authentication failed: session isn't valid");
      return errAsync(unauthorized());
    }

    return instance.useCases.auth.authenticate
      .handle(new AuthenticateCommand(result.value))
      .andTee((session) => {
        this.session = session;
        this.sessionId = result.value;
      })
      .map(() => undefined);
  };
}

export default fp(
  async (fastify) => {
    fastify.decorateRequest("session", null);
    fastify.decorateRequest("sessionId", null);

    fastify.addHook("onRequest", async (req) => {
      req.session = null;
      req.sessionId = null;
    });

    fastify.decorateRequest("authenticate", authenticate(fastify));
  },
  {
    name: "authentication",
    dependencies: ["cookie"],
  },
);
