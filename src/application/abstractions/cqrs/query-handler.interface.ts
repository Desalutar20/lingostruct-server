import { ResultAsync } from "@/domain/abstractions/result.js";
import { IQuery } from "./query.interface.js";

export interface IQueryHandler<TQuery extends IQuery<TResponse>, TResponse> {
  handle: (query: TQuery) => ResultAsync<TResponse>;
}
