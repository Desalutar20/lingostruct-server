import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { LoggerConfig } from "@/application/config/logger.config.js";
import pino from "pino";

export class PinoLogger implements ILogger {
  public readonly logger: pino.Logger;

  constructor(configOrChild: LoggerConfig | pino.Logger) {
    if (configOrChild instanceof LoggerConfig) {
      const transport = !configOrChild.structured
        ? { transport: { target: "pino-pretty", options: { colorize: true } } }
        : {};

      this.logger = pino({
        level: configOrChild.level,
        ...transport,
        formatters: {
          level(label) {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      });
      return;
    }

    this.logger = configOrChild;
  }

  trace(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      this.logger.trace(meta, message);
      return;
    }

    this.logger.trace(message);
  }

  debug(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      this.logger.debug(meta, message);
      return;
    }

    this.logger.debug(message);
  }

  info(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      this.logger.info(meta, message);
      return;
    }

    this.logger.info(message);
  }

  warn(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      this.logger.warn(meta, message);
      return;
    }

    this.logger.warn(message);
  }

  error(error: Error): void;
  error(message: string, meta?: unknown): void;
  error(errorOrMessage: Error | string, meta?: unknown): void {
    if (errorOrMessage instanceof Error) {
      this.logger.error(errorOrMessage);
      return;
    }

    if (meta !== undefined) {
      this.logger.error(meta, errorOrMessage);
      return;
    }

    this.logger.error(errorOrMessage);
  }

  fatal(message: string, meta?: unknown): void {
    if (meta !== undefined) {
      this.logger.fatal(meta, message);
      return;
    }

    this.logger.fatal(message);
  }

  child(bindings: Record<string, any>) {
    return new PinoLogger(this.logger.child(bindings));
  }
}
