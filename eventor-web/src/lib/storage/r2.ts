import "server-only";

import { randomBytes } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type R2Config = {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
};

export type CoverImageTarget = "groups" | "events";

let cachedClient: S3Client | null = null;

export function getR2Client() {
  if (!cachedClient) {
    const config = getR2Config();

    cachedClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  return cachedClient;
}

export async function uploadPublicImage(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const config = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    key: input.key,
    url: `${config.publicUrl.replace(/\/+$/, "")}/${input.key}`,
  };
}

export async function deleteImageObject(key: string | null | undefined) {
  if (!key) {
    return;
  }

  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}

export function createCoverImageKey(input: {
  target: CoverImageTarget;
  id: number;
  extension: string;
  now?: number;
  randomBytesValue?: Buffer;
}) {
  const timestamp = input.now ?? Date.now();
  const random = (input.randomBytesValue ?? randomBytes(12)).toString("hex");
  const extension = input.extension.replace(/^\.+/, "").toLowerCase();

  return `${input.target}/${input.id}/cover-${timestamp}-${random}.${extension}`;
}

function getR2Config(): R2Config {
  return {
    endpoint: getRequiredEnv("R2_ENDPOINT_URL"),
    bucketName: getRequiredEnv("R2_BUCKET_NAME"),
    accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    publicUrl: getRequiredEnv("R2_PUBLIC_URL"),
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required R2 environment variable: ${name}`);
  }

  return value;
}
