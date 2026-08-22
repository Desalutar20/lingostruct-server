import { Result, ResultAsync } from "@/domain/abstractions/result.js";
import { MimeType } from "@/domain/shared/value-objects/mime-type.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { URL } from "@/domain/shared/value-objects/url.js";

export interface IObjectStorage {
  createUploadUrl(key: NonEmptyString, contentType: MimeType): ResultAsync<URL>;
  createDownloadUrl(key: NonEmptyString): ResultAsync<URL>;
  deleteObject(key: NonEmptyString): ResultAsync<void>;
}
