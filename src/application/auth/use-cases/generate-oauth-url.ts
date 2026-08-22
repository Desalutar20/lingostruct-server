import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { OAuthProvider } from "@/domain/user/oauth-provider.js";
import { okAsync } from "neverthrow";
import { URL } from "@/domain/shared/value-objects/url.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";

export class GenerateOAuthUrlCommand implements ICommand<[URL, OAuthState]> {
  constructor(
    public readonly provider: OAuthProvider,
    public readonly redirectPath?: NonEmptyString,
  ) {}
}

export class GenerateOAuthUrlCommandHandler implements ICommandHandler<
  GenerateOAuthUrlCommand,
  [URL, OAuthState]
> {
  constructor(private readonly oauthClientFactory: IOAuthClientFactory) {}

  handle(command: GenerateOAuthUrlCommand): ResultAsync<[URL, OAuthState]> {
    const provider = this.oauthClientFactory.get(command.provider);

    const state = new OAuthState(UUID.generate(), command.redirectPath);
    const url = provider.generateRedirectUrl(state);

    return okAsync([url, state]);
  }
}
