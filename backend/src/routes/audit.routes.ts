import { Router } from "express";
import { OfficerRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { audit } from "../services/audit.service.js";

export const auditRoutes = Router();

auditRoutes.get(
  "/",
  requireAuth,
  requireRole(OfficerRole.ADMIN),
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: { officer: { select: { badgeNumber: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    await audit(req, "VIEW", "AuditLog");
    res.json({ logs });
  })
);
