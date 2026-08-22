import { failure } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";
import { err, ok } from "neverthrow";

export class OAuthState {
  private static readonly delimiter = "|";

  constructor(
    private readonly _stateId: UUID,
    private readonly _additionalState?: NonEmptyString,
  ) {}

  public get stateId() {
    return this._stateId;
  }

  public get additionalState() {
    return this._additionalState;
  }

  public static create(value: string): Result<OAuthState> {
    const trimmed = value?.trim();
    if (trimmed.length === 0) return err(failure("Invalid oauth state", "OPERATION_FAILED"));

    const parts = trimmed.split(OAuthState.delimiter);
    if (parts.length === 0) return err(failure("Invalid oauth state", "OPERATION_FAILED"));

    return UUID.create(parts[0])
      .map((id) => {
        const additionalState = NonEmptyString.create(parts[1] ?? "")
          .orElse(() => ok(undefined))
          ._unsafeUnwrap();

        return new OAuthState(id, additionalState);
      })
      .mapErr(() => failure("Invalid oauth state", "OPERATION_FAILED"));
  }

  toString() {
    return this._additionalState
      ? `${this._stateId}${OAuthState.delimiter}${encodeURI(this.additionalState!.value)}`
      : this._stateId.toString();
  }
}
