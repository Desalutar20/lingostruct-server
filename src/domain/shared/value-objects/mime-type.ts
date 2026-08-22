import { err, ok } from "neverthrow";
import { NonEmptyString } from "./non-empty-string.js";
import { validation } from "@/domain/abstractions/errors.js";
import { Result } from "@/domain/abstractions/result.js";

export class MimeType extends NonEmptyString {
  private static mimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "application/zip",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "text/html",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ] as const;
  protected override readonly _value: (typeof MimeType.mimeTypes)[number];

  constructor(value: (typeof MimeType.mimeTypes)[number]) {
    super(value);
    this._value = value;
  }

  public static create(value: string): Result<MimeType> {
    return super
      .create(value, "mimeType", "Mime type", {
        additionalCheck: (value) => {
          if (
            !MimeType.mimeTypes.includes(value.toString() as (typeof MimeType.mimeTypes)[number])
          ) {
            return err(validation("mimeType", ["Invalid mime type"]));
          }

          return ok();
        },
      })
      .map((val) => new MimeType(val.value as (typeof MimeType.mimeTypes)[number]));
  }
}
