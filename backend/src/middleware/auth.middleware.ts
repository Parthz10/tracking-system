import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { OfficerRole } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";

declare global {
  // Express request augmentation is intentionally declared with namespace merging.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      officer?: {
        id: string;
        badgeNumber: string;
        role: OfficerRole;
      };
    }
  }
}

type JwtPayload = {
  sub: string;
  badgeNumber: string;
  role: OfficerRole;
};

const roleRank: Record<OfficerRole, number> = {
  OFFICER: 1,
  SUPERVISOR: 2,
  ADMIN: 3
};

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) throw new HttpError(401, "Missing bearer token");

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const officer = await prisma.officer.findFirst({
      where: { id: payload.sub, active: true },
      select: { id: true, badgeNumber: true, role: true }
    });

    if (!officer) throw new HttpError(401, "Officer account is inactive or missing");

    req.officer = officer;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Invalid bearer token"));
  }
}

export function requireRole(role: OfficerRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.officer) return next(new HttpError(401, "Authentication required"));
    if (roleRank[req.officer.role] < roleRank[role]) {
      return next(new HttpError(403, "Insufficient role"));
    }
    next();
  };
}
