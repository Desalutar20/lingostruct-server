import { createApp } from "./app.js";
import { loadConfig } from "@/infrastructure/config/index.js";
import closeWithGrace from "close-with-grace";

const deepFreeze = (o: any) => {
  Object.freeze(o);
  if (o === undefined || o === null) {
    return o;
  }

  for (const prop of Object.getOwnPropertyNames(o)) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  }

  return o;
};

const config = loadConfig();
deepFreeze(config);

const app = await createApp(config);

closeWithGrace({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    app.log.fatal({ err }, "server closing with error");
  } else {
    app.log.info(`${signal} received, server closing `);
  }

  await app.close();
});

try {
  await app.listen({
    host: "0.0.0.0",
    port: config.application.port,
  });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
