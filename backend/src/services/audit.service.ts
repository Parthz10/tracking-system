import crypto from "node:crypto";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";

function hashIp(ip?: string) {
  if (!ip) return undefined;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export async function audit(req: Request, action: string, entity: string, entityId?: string, metadata?: unknown) {
  const officer = req.officer;

  await prisma.auditLog.create({
    data: {
      officerId: officer?.id,
      action,
      entity,
      entityId,
      ipHash: hashIp(req.ip),
      metadata: metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata))
    }
  });
}
