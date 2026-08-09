export interface ILogger {
  trace(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(error: Error): void;
  error(message: string, meta?: unknown): void;
  fatal(message: string, meta?: unknown): void;

  child(bindings: Record<string, any>): ILogger;
}
