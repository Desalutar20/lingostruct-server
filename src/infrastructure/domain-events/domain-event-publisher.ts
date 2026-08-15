import { IDomainEventHandler } from "@/application/abstractions/domain-events/domain-event-handler.interface.js";
import { IDomainEventPublisher } from "@/application/abstractions/domain-events/domain-event-publisher.interface.js";
import { ILogger } from "@/application/abstractions/logger/logger.interface.js";
import { DomainEvent } from "@/domain/abstractions/domain-event.js";
import { ResultAsync } from "neverthrow";

type DomainEventConstructor<T extends DomainEvent<unknown>> = abstract new (...args: any[]) => T;

export class DomainEventPublisher implements IDomainEventPublisher {
  private readonly _handlers = new Map<DomainEventConstructor<any>, IDomainEventHandler<any>[]>();

  constructor(private readonly logger: ILogger) {}

  subscribe<T extends DomainEvent<unknown>>(
    event: DomainEventConstructor<T>,
    handlers: IDomainEventHandler<T>[],
  ) {
    const h = handlers.concat(this._handlers.get(event) ?? []);

    const uniqueHandlers: IDomainEventHandler<T>[] = [];

    for (const handler of h) {
      if (uniqueHandlers.some((h) => h.constructor.name === handler.constructor.name)) continue;

      uniqueHandlers.push(handler);
    }

    this._handlers.set(event, uniqueHandlers);
  }

  publish<T>(events: DomainEvent<T>[]): void {
    void this.process(events);
  }

  private async process<T>(events: DomainEvent<T>[]) {
    for (const event of events) {
      const handlers = this._handlers.get(event.constructor as DomainEventConstructor<any>);
      if (!handlers?.length) {
        this.logger.warn(`No handlers registered for domain event: ${event.constructor.name}`);
        continue;
      }

      await ResultAsync.combineWithAllErrors(
        handlers.map((handler) =>
          handler
            .handle(event)
            .orTee((error) =>
              this.logger.error(
                `Domain event handler failed: ${event.constructor.name} - ${String(error)}`,
              ),
            ),
        ),
      );
    }
  }
}
