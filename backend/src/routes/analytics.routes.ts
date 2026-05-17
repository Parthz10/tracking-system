import { Router } from "express";
import { OfficerRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { audit } from "../services/audit.service.js";

export const analyticsRoutes = Router();

analyticsRoutes.get(
  "/summary",
  requireAuth,
  requireRole(OfficerRole.SUPERVISOR),
  asyncHandler(async (req, res) => {
    const [byStatus, byType, urgent, unassigned, activeMissing] = await Promise.all([
      prisma.report.groupBy({ by: ["status"], _count: true }),
      prisma.report.groupBy({ by: ["type"], _count: true }),
      prisma.report.count({ where: { priority: "URGENT" } }),
      prisma.report.count({ where: { assignedToId: null } }),
      prisma.missingPerson.count({ where: { status: "ACTIVE" } })
    ]);

    await audit(req, "VIEW", "AnalyticsSummary");
    res.json({ byStatus, byType, urgent, unassigned, activeMissing });
  })
);
