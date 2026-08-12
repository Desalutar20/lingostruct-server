import { OAuthState, OAuthUser } from "@/application/abstractions/auth/oauth-user.type.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export interface IOAuthClient {
  generateRedirectUrl: (state: OAuthState) => URL;
  isValidState: (received: OAuthState, expected: OAuthState) => boolean;
  getUser: (code: NonEmptyString) => ResultAsync<OAuthUser>;
}
