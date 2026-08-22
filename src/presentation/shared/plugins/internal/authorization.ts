import { type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { errAsync, okAsync } from "neverthrow";
import { accessForbidden } from "@/domain/abstractions/errors.js";
import { UserRole } from "@/domain/user/user-role.js";

declare module "fastify" {
  export interface FastifyRequest {
    authorize: ReturnType<typeof authorize>;
  }
}

function authorize() {
  return function (this: FastifyRequest, roles: UserRole[]): ResultAsync<void> {
    const session = this.session;
    if (!session) {
      return errAsync(accessForbidden());
    }

    if (!roles.some((role) => role.value === session.role)) {
      return errAsync(accessForbidden());
    }

    return okAsync();
  };
}

export default fp(
  async (fastify) => {
    fastify.decorateRequest("authorize", authorize());
  },
  {
    name: "authorization",
  },
);
