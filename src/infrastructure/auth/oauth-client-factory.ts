import { IOAuthClientFactory } from "@/application/abstractions/auth/oauth-client-factory.interface.js";
import { IOAuthClient } from "@/application/abstractions/auth/oauth-client.interface.js";
import { OAuthConfig } from "@/application/config/oauth.config.js";
import { OAuthProvider } from "@/domain/users/oauth-provider.js";
import { GithubOAuthClient } from "@/infrastructure/auth/github/github-oauth.client.js";
import { GoogleOAuthClient } from "@/infrastructure/auth/google/google-oauth-client.js";

export class OAuthClientFactory implements IOAuthClientFactory {
  private readonly googleOAuthClient: GoogleOAuthClient;
  private readonly githubOAuthClient: GithubOAuthClient;

  constructor(config: OAuthConfig) {
    this.googleOAuthClient = new GoogleOAuthClient(config);
    this.githubOAuthClient = new GithubOAuthClient(config);
  }

  get(provider: OAuthProvider): IOAuthClient {
    switch (provider.value) {
      case "google":
        return this.googleOAuthClient;

      case "github":
        return this.githubOAuthClient;

      default: {
        const _exhaustiveCheck: never = provider.value;
        return _exhaustiveCheck;
      }
    }
  }
}
