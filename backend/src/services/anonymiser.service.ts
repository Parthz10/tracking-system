import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

export function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createAnonymousToken() {
  const token = generateRawToken();
  const tokenHash = hashToken(token);
  const record = await prisma.anonymousToken.create({ data: { tokenHash } });
  return { token, tokenId: record.id };
}

export async function findAnonymousToken(rawToken: string) {
  return prisma.anonymousToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
}
