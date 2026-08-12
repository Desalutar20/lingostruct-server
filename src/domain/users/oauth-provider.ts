import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { Result } from "@/domain/abstractions/result.js";
import { err, ok } from "neverthrow";
import { validation } from "@/domain/abstractions/errors.js";

export class OAuthProvider extends NonEmptyString {
  protected override readonly _value: "google" | "github";

  public static readonly Google = new OAuthProvider("google");
  public static readonly Github = new OAuthProvider("github");

  private constructor(value: "google" | "github") {
    super(value);
    this._value = value;
  }

  public override get value() {
    return this._value;
  }

  public static create(value: string): Result<OAuthProvider> {
    switch (value) {
      case "google":
        return ok(OAuthProvider.Google);

      case "github":
        return ok(OAuthProvider.Github);

      default:
        return err(validation("provider", [`Invalid oauth provider: ${value}`]));
    }
  }
}
