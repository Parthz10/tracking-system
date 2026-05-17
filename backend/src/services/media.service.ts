import crypto from "node:crypto";
import sharp from "sharp";
import { Client } from "minio";
import { env } from "../config/env.js";

const minio = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.NODE_ENV === "production",
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY
});

export async function ensureMediaBucket() {
  const exists = await minio.bucketExists(env.MINIO_BUCKET).catch(() => false);
  if (!exists) {
    await minio.makeBucket(env.MINIO_BUCKET);
  }
}

export async function sanitiseImage(buffer: Buffer, mimeType: string) {
  if (!mimeType.startsWith("image/")) {
    return buffer;
  }

  return sharp(buffer).rotate().toBuffer();
}

export async function scanMedia(buffer: Buffer) {
  const eicar = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR";
  return !buffer.toString("latin1").includes(eicar);
}

export async function uploadMedia(buffer: Buffer, mimeType: string) {
  await ensureMediaBucket();
  const objectKey = `${crypto.randomUUID()}`;

  await minio.putObject(env.MINIO_BUCKET, objectKey, buffer, buffer.length, {
    "Content-Type": mimeType,
    "X-Amz-Server-Side-Encryption": "AES256"
  });

  return objectKey;
}
