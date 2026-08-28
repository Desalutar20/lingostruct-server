import { validation } from "@/domain/abstractions/errors.js";
import { Result, ResultWithAllErrors } from "@/domain/abstractions/result.js";
import { ValueObject } from "@/domain/shared/value-objects/value-object.js";
import { err, ok } from "neverthrow";
import { Result as Rs } from "neverthrow";

export class WorkspaceAddress extends ValueObject<WorkspaceAddress> {
  public static readonly countryMaxLength = 50;
  public static readonly cityMaxLength = 100;
  public static readonly streetMaxLength = 100;
  public static readonly streetNumberMaxLength = 50;
  public static readonly postalCodeMaxLength = 20;

  private constructor(
    protected readonly _country: string,
    protected readonly _city: string,
    protected readonly _street: string,
    protected readonly _streetNumber: string,
    protected readonly _postalCode: string,
  ) {
    super();
  }

  public get country(): string {
    return this._country;
  }

  public get city(): string {
    return this._city;
  }
  public get street(): string {
    return this._street;
  }
  public get streetNumber(): string {
    return this._streetNumber;
  }
  public get postalCode(): string {
    return this._postalCode;
  }

  public static create(values: {
    country: string;
    city: string;
    street: string;
    streetNumber: string;
    postalCode: string;
  }): ResultWithAllErrors<WorkspaceAddress> {
    const country = values.country?.trim();
    const city = values.city?.trim();
    const street = values.street?.trim();
    const streetNumber = values.streetNumber?.trim();
    const postalCode = values.postalCode?.trim();

    return Rs.combineWithAllErrors([
      WorkspaceAddress.validate(
        country,
        "country",
        "Workspace country",
        WorkspaceAddress.countryMaxLength,
      ),
      WorkspaceAddress.validate(city, "city", "Workspace city", WorkspaceAddress.cityMaxLength),
      WorkspaceAddress.validate(
        street,
        "street",
        "Workspace street",
        WorkspaceAddress.streetMaxLength,
      ),
      WorkspaceAddress.validate(
        streetNumber,
        "streetNumber",
        "Workspace street number",
        WorkspaceAddress.streetNumberMaxLength,
      ),
      WorkspaceAddress.validate(
        postalCode,
        "postalCode",
        "Workspace postal code",
        WorkspaceAddress.postalCodeMaxLength,
      ),
    ]).map(() => new WorkspaceAddress(country, city, street, streetNumber, postalCode));
  }

  public equals(other: WorkspaceAddress): boolean {
    return (
      this.constructor === other.constructor &&
      this._country === other._country &&
      this._city === other._city &&
      this._street === other._street &&
      this._streetNumber === other._streetNumber &&
      this._postalCode === other._postalCode
    );
  }

  public toString() {
    return `${this.country ?? ""} ${this.city ?? ""} ${this.street ?? ""} ${this.street ?? ""} ${this.postalCode ?? ""}`;
  }

  private static validate(
    value: string | undefined,
    field: string,
    label: string,
    maxLength: number,
  ): Result<void> {
    if (value === undefined) return ok();

    if (value.length > maxLength) {
      return err(
        validation(field, [
          `${label} can't be longer than ${WorkspaceAddress.countryMaxLength} characters`,
        ]),
      );
    }

    return ok();
  }
}
