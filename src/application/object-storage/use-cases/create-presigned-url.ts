import { ICommandHandler } from "@/application/abstractions/cqrs/command-handler.interface.js";
import { ICommand } from "@/application/abstractions/cqrs/command.interface.js";
import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { ResultAsync } from "@/domain/abstractions/result.js";
import { MimeType } from "@/domain/shared/value-objects/mime-type.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { UUID } from "@/domain/shared/value-objects/uuid.js";

export class CreatePresignedUrlCommand implements ICommand<{ uploadUrl: URL; publicUrl: URL }> {
  constructor(public readonly mimeType: MimeType) {}
}

export class CreatePresignedUrlCommandHandler implements ICommandHandler<
  CreatePresignedUrlCommand,
  { uploadUrl: URL; publicUrl: URL }
> {
  constructor(public readonly objectStorage: IObjectStorage) {}

  handle(command: CreatePresignedUrlCommand): ResultAsync<{ uploadUrl: URL; publicUrl: URL }> {
    const prefix = this.getFilePrefix(command.mimeType);
    const key = NonEmptyString.create(`${prefix}/${UUID.generate().value}`)._unsafeUnwrap();

    return this.objectStorage
      .createUploadUrl(key, command.mimeType)
      .andThen((url) =>
        this.objectStorage.getPublicUrl(key).map((publicUrl) => ({ uploadUrl: url, publicUrl })),
      );
  }

  private getFilePrefix(mimeType: MimeType) {
    if (mimeType.value.startsWith("image/")) {
      return "public/images";
    }

    if (mimeType.value.startsWith("video/")) {
      return "public/videos";
    }

    if (mimeType.value.startsWith("audio/")) {
      return "public/audio";
    }

    if (mimeType.value === "application/pdf" || mimeType.value === "application/zip") {
      return "public/documents";
    }

    return "public/files";
  }
}
