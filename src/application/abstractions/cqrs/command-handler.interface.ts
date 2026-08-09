import { ResultAsync } from "@/domain/abstractions/result.js";
import { ICommand } from "./command.interface.js";

export interface ICommandHandler<TCommand extends ICommand<TResponse>, TResponse = void> {
  handle: (command: TCommand) => ResultAsync<TResponse>;
}
