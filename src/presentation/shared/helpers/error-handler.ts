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

export const mapAppErrorToHttpError = (reply: FastifyReply, error: AppError | AppError[]) => {
  if (Array.isArray(error) && error.every((err) => err.code === "VALIDATION")) {
    return reply.status(400).send({
      status: "error",
      code: "VALIDATION",
      errors: error.reduce(
        (acc, val) => {
          acc[val.field] = val.errors;
          return acc;
        },
        {} as Record<string, string[]>,
      ),
    });
  }

  const err = Array.isArray(error) ? error[0] : error;

  if (err.type === "Validation") {
    return reply
      .status(400)
      .send({ status: "error", code: err.code, errors: { [err.field]: err.errors } });
  }

  const [status, message] = mapErrorToCodeAndMessage(err);

  if (err.type !== "Internal") {
    return reply.status(status).send({ status: "error", code: err.code, error: message });
  }

  reply.log.error(
    {
      err: err.error,
    },
    `Unhandled error occurred - ${err.message}`,
  );
  return reply.status(status).send({ status: "error", code: err.code, error: message });
};
