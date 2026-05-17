import { Router } from "express";
import { OfficerRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { publicRateLimit } from "../middleware/rate-limit.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  assignReportSchema,
  createReportSchema,
  reportListQuerySchema,
  updatePrioritySchema,
  updateStatusSchema
} from "../schemas/report.schema.js";
import { rawTokenSchema } from "../schemas/common.js";
import { findAnonymousToken } from "../services/anonymiser.service.js";
import { audit } from "../services/audit.service.js";

export const reportRoutes = Router();

reportRoutes.post(
  "/",
  publicRateLimit,
  validateBody(createReportSchema),
  asyncHandler(async (req, res) => {
    const token = await findAnonymousToken(req.body.token);
    if (!token) throw new HttpError(400, "Unknown anonymous token");

    const report = await prisma.report.create({
      data: {
        type: req.body.type,
        description: req.body.description,
        district: req.body.district,
        municipality: req.body.municipality,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        anonymousTokenId: token.id,
        updates: { create: { status: "RECEIVED", note: "Report received by Nepal Police safety system." } }
      },
      include: { updates: true }
    });

    res.status(201).json({ reportId: report.id, status: report.status, createdAt: report.createdAt });
  })
);

reportRoutes.get(
  "/track/:token",
  publicRateLimit,
  asyncHandler(async (req, res) => {
    const parsedToken = rawTokenSchema.safeParse(req.params.token);
    if (!parsedToken.success) throw new HttpError(400, "Invalid token");

    const token = await findAnonymousToken(parsedToken.data);
    if (!token) throw new HttpError(404, "No reports found for this token");

    const reports = await prisma.report.findMany({
      where: { anonymousTokenId: token.id },
      select: {
        id: true,
        type: true,
        status: true,
        priority: true,
        district: true,
        createdAt: true,
        updates: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ reports });
  })
);

reportRoutes.get(
  "/",
  requireAuth,
  validateQuery(reportListQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof reportListQuerySchema>;
    const where: Prisma.ReportWhereInput = {
      status: query.status,
      type: query.type,
      priority: query.priority,
      district: query.district
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { assignedTo: { select: { badgeNumber: true } }, updates: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.report.count({ where })
    ]);

    await audit(req, "LIST", "Report", undefined, where);
    res.json({ reports, total, page: query.page, pageSize: query.pageSize });
  })
);

reportRoutes.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id as string },
      include: {
        assignedTo: { select: { badgeNumber: true } },
        media: true,
        updates: { include: { officer: { select: { badgeNumber: true } } }, orderBy: { createdAt: "asc" } }
      }
    });

    if (!report) throw new HttpError(404, "Report not found");

    await audit(req, "VIEW", "Report", report.id);
    res.json({ report });
  })
);

reportRoutes.patch(
  "/:id/status",
  requireAuth,
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const report = await prisma.report.update({
      where: { id: req.params.id as string },
      data: {
        status: req.body.status,
        updates: {
          create: { status: req.body.status, note: req.body.note, officerId: req.officer?.id }
        }
      },
      include: { updates: { orderBy: { createdAt: "asc" } } }
    });

    await audit(req, "UPDATE_STATUS", "Report", report.id, { status: req.body.status });
    res.json({ report });
  })
);

reportRoutes.patch(
  "/:id/priority",
  requireAuth,
  requireRole(OfficerRole.SUPERVISOR),
  validateBody(updatePrioritySchema),
  asyncHandler(async (req, res) => {
    const report = await prisma.report.update({
      where: { id: req.params.id as string },
      data: { priority: req.body.priority }
    });

    await audit(req, "UPDATE_PRIORITY", "Report", report.id, { priority: req.body.priority });
    res.json({ report });
  })
);

reportRoutes.patch(
  "/:id/assign",
  requireAuth,
  requireRole(OfficerRole.SUPERVISOR),
  validateBody(assignReportSchema),
  asyncHandler(async (req, res) => {
    const officer = await prisma.officer.findUnique({ where: { badgeNumber: req.body.badgeNumber } });
    if (!officer || !officer.active) throw new HttpError(404, "Officer not found");

    const report = await prisma.report.update({
      where: { id: req.params.id as string },
      data: {
        assignedToId: officer.id,
        status: "ASSIGNED",
        updates: {
          create: { status: "ASSIGNED", note: `Assigned to ${officer.badgeNumber}`, officerId: req.officer?.id }
        }
      }
    });

    await audit(req, "ASSIGN", "Report", report.id, { assignedTo: officer.badgeNumber });
    res.json({ report });
  })
);
