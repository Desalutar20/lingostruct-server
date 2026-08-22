import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { MimeType } from "@/domain/shared/value-objects/mime-type.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

export class CreatePresignedUrlCommand implements ICommand<{ url: URL; key: NonEmptyString }> {
  constructor(public readonly mimeType: MimeType) {}
}

export class CreatePresignedUrlCommandHandler implements ICommandHandler<
  CreatePresignedUrlCommand,
  { url: URL; key: NonEmptyString }
> {
  constructor(public readonly objectStorage: IObjectStorage) {}

  handle(command: CreatePresignedUrlCommand): ResultAsync<{ url: URL; key: NonEmptyString }> {
    const prefix = this.getFilePrefix(command.mimeType);
    const key = NonEmptyString.create(`${prefix}/${UUID.generate().value}`)._unsafeUnwrap();

    return this.objectStorage.createUploadUrl(key, command.mimeType).map((url) => ({ url, key }));
  }

  private getFilePrefix(mimeType: MimeType) {
    if (mimeType.value.startsWith("image/")) {
      return "images";
    }

    if (mimeType.value.startsWith("video/")) {
      return "videos";
    }

    if (mimeType.value.startsWith("audio/")) {
      return "audio";
    }

    if (mimeType.value === "application/pdf" || mimeType.value === "application/zip") {
      return "documents";
    }

    return "files";
  }
}
