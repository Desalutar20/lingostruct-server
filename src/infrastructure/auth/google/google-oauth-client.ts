import { IOAuthClient } from "@/application/abstractions/auth/oauth-client.interface.js";
import { OAuthUser } from "@/application/abstractions/auth/oauth-user.type.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { Email } from "@/domain/shared/value-objects/email.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { ProviderId } from "@/domain/user/provider-id.js";
import {
  GoogleOAuthUserSchema,
  GoogleOAuthAccessTokenSchema,
} from "@/infrastructure/auth/google/google-oauth.schema.js";
import { OAuthClient } from "@/infrastructure/auth/oauth-client.js";
import { err, fromPromise } from "neverthrow";
import z from "zod";
import { URL } from "@/domain/shared/value-objects/url.js";
import { OAuthState } from "@/application/abstractions/auth/oauth-state.js";

export class GoogleOAuthClient extends OAuthClient implements IOAuthClient {
  constructor(config: OAuthConfig) {
    super(config, "google");
  }

  generateRedirectUrl(state: OAuthState): URL {
    const url = new globalThis.URL("https://accounts.google.com/o/oauth2/v2/auth");

    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.redirectUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email profile");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("state", state.toString());

    return URL.create(url.toString())._unsafeUnwrap();
  }

  getUser(code: NonEmptyString): ResultAsync<OAuthUser> {
    return fromPromise(
      (async () => {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          body: JSON.stringify({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code.value,
            redirect_uri: this.redirectUrl,
            grant_type: "authorization_code",
          }),
        });
        if (!tokenRes.ok) {
          return err(internal(`Google OAuth token exchange failed: ${tokenRes.status}`));
        }

        const { data, error } = await GoogleOAuthAccessTokenSchema.safeParseAsync(
          await tokenRes.json(),
        );
        if (error) {
          return err(
            internal(
              `Failed to validate Google OAuth access token response: ${z.prettifyError(error)}`,
              error,
            ),
          );
        }

        const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (!profileRes.ok) {
          return err(internal(`Google OAuth user profile request failed: ${profileRes.status}`));
        }

        const { error: userSchemaError, data: profileData } =
          await GoogleOAuthUserSchema.safeParseAsync(await profileRes.json());

        if (userSchemaError) {
          return err(
            internal(
              `Failed to validate Google OAuth user profile response: ${z.prettifyError(userSchemaError)}`,
            ),
          );
        }

        if (!profileData.verified_email) {
          return err(internal("Google OAuth account email is not verified"));
        }

        return Email.create(profileData.email).andThen((email) =>
          ProviderId.create(profileData.id).map(
            (providerId) => ({ email, providerId }) satisfies OAuthUser,
          ),
        );
      })(),
      (error) => internal("Google OAuth request failed unexpectedly", error),
    ).andThen((result) => result);
  }
}
