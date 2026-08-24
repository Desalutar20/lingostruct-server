import { IObjectStorage } from "@/application/abstractions/object-storage/object-storage.interface.js";
import { S3Config } from "@/application/config/s3.config.js";
import { internal } from "@/domain/abstractions/errors.js";
import { Result, ResultAsync } from "@/domain/abstractions/result.js";
import { URL } from "@/domain/shared/value-objects/url.js";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { fromPromise } from "neverthrow";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MimeType } from "@/domain/shared/value-objects/mime-type.js";
import { NonEmptyString } from "@/domain/shared/value-objects/non-empty-string.js";

export class S3ObjectStorage implements IObjectStorage {
  private readonly client: S3;
  private readonly mainBucket: string;
  private readonly publicUrl: string;
  private readonly uploadUrlTtl: number;
  private readonly downloadUrlTtl: number;

  constructor(config: S3Config) {
    this.client = new S3({
      endpoint: `${config.host}:${config.port}`,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    });
    this.mainBucket = config.mainBucket;
    this.publicUrl = `${config.host}:${config.port}`;
    this.uploadUrlTtl = config.uploadUrlTTLMinutes * 60;
    this.downloadUrlTtl = config.downloadUrlTTLMinutes * 60;
  }

  getPublicUrl(key: NonEmptyString): Result<URL> {
    return URL.create(`${this.publicUrl}/${this.mainBucket}/${key.value}`);
  }

  public createDownloadUrl(key: NonEmptyString): ResultAsync<URL> {
    return fromPromise(
      getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.mainBucket,
          Key: key.value,
        }),
        {
          expiresIn: this.downloadUrlTtl,
        },
      ),
      (err) => internal("Failed to create download URL", err),
    ).andThen((url) => URL.create(url));
  }

  public createUploadUrl(key: NonEmptyString, contentType: MimeType): ResultAsync<URL> {
    return fromPromise(
      getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.mainBucket,
          Key: key.value,
          ContentType: contentType.value,
        }),
        {
          expiresIn: this.uploadUrlTtl,
        },
      ),
      (err) => internal("Failed to create upload URL", err),
    ).andThen((url) => URL.create(url));
  }

  public deleteObject(key: NonEmptyString): ResultAsync<void> {
    return fromPromise(
      this.client.send(
        new DeleteObjectCommand({
          Bucket: this.mainBucket,
          Key: key.value,
        }),
      ),
      (err) => internal("Failed to delete object", err),
    ).map(() => undefined);
  }

  close() {
    this.client.destroy();
  }
}
