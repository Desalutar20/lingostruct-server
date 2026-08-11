import { AppError } from "@/domain/abstractions/errors.js";
import { FastifyReply } from "fastify";

const mapErrorToCodeAndMessage = (error: AppError): [number, string] => {
  switch (error.type) {
    case "Failure":
      return [400, error.message];
    case "Validation":
      return [400, ""];
    case "AccessForbidden":
      return [403, "Access denied"];
    case "Unauthorized":
      return [401, "Unauthorized"];
    case "Internal":
      return [500, "Internal server error"];
    default:
      const x: never = error;
      return x;
  }
};

export const mapAppErrorToHttpError = (reply: FastifyReply, error: AppError) => {
  if (error.type === "Validation") {
    return reply.status(400).send({ status: "error", code: error.code, errors: error.errors });
  }

  const [status, message] = mapErrorToCodeAndMessage(error);

  if (error.type !== "Internal") {
    return reply.status(status).send({ status: "error", code: error.code, error: message });
  }

  reply.log.error(
    {
      err: error.error,
    },
    `Unhandled error occurred - ${error.message}`,
  );
  return reply.status(status).send({ status: "error", code: error.code, error: message });
};
