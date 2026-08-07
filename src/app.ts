import { Config } from "./application/config/index.js";
import { createServer } from "./presentation/server.js";

export const createApp = async (config: Config) => {
  const server = await createServer(config);

  return server;
};
