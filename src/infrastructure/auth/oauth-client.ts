import { IOAuthClient } from "@/application/abstractions/auth/oauth-client.interface.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";
import { OAuthUser } from "@/application/abstractions/auth/oauth-user.type.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { URL } from "@/domain/shared/value-objects/url.js";

export abstract class OAuthClient implements IOAuthClient {
  protected readonly clientId: string;
  protected readonly redirectUrl: string;
  protected readonly clientSecret: string;

  constructor(config: OAuthConfig, key: keyof InstanceType<typeof OAuthConfig>) {
    this.clientId = config[key].clientId;
    this.redirectUrl = config[key].redirectUrl;
    this.clientSecret = config[key].clientSecret;
  }

  public abstract generateRedirectUrl(state: OAuthState): URL;
  public abstract getUser(code: NonEmptyString): ResultAsync<OAuthUser>;

  isValidState(received: OAuthState, expected: OAuthState): boolean {
    if (!received.stateId.equals(expected.stateId)) {
      return false;
    }

    if (received.additionalState === undefined) {
      return expected.additionalState === undefined;
    }

    return (
      expected.additionalState !== undefined &&
      received.additionalState.equals(expected.additionalState)
    );
  }
}
