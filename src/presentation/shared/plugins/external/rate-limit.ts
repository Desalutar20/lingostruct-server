import fastifyRateLimit, { type CreateRateLimitOptions } from "@fastify/rate-limit";

export const autoConfig = (): CreateRateLimitOptions => {
  return {
    max: 100,
    timeWindow: "1 minute",
  };
};

export default fastifyRateLimit;
