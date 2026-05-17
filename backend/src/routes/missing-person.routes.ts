import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { publicRateLimit } from "../middleware/rate-limit.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createMissingPersonSchema,
  missingPersonQuerySchema,
  updateMissingStatusSchema
} from "../schemas/missing-person.schema.js";
import { findAnonymousToken } from "../services/anonymiser.service.js";
import { audit } from "../services/audit.service.js";

export const missingPersonRoutes = Router();

missingPersonRoutes.post(
  "/",
  publicRateLimit,
  validateBody(createMissingPersonSchema),
  asyncHandler(async (req, res) => {
    const token = await findAnonymousToken(req.body.token);
    if (!token) throw new HttpError(400, "Unknown anonymous token");

    const missingPerson = await prisma.missingPerson.create({
      data: {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        lastSeenLocation: req.body.lastSeenLocation,
        district: req.body.district,
        photoObjectKey: req.body.photoObjectKey,
        anonymousTokenId: token.id
      }
    });

    res.status(201).json({ missingPerson });
  })
);

missingPersonRoutes.get(
  "/",
  publicRateLimit,
  validateQuery(missingPersonQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof missingPersonQuerySchema>;
    const where: Prisma.MissingPersonWhereInput = {
      status: "ACTIVE",
      district: query.district,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { lastSeenLocation: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [missingPersons, total] = await Promise.all([
      prisma.missingPerson.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      prisma.missingPerson.count({ where })
    ]);

    res.json({ missingPersons, total, page: query.page, pageSize: query.pageSize });
  })
);

missingPersonRoutes.get(
  "/admin",
  requireAuth,
  validateQuery(missingPersonQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof missingPersonQuerySchema>;
    const where: Prisma.MissingPersonWhereInput = {
      district: query.district,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { lastSeenLocation: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const missingPersons = await prisma.missingPerson.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    });

    await audit(req, "LIST", "MissingPerson", undefined, where);
    res.json({ missingPersons });
  })
);

missingPersonRoutes.patch(
  "/:id/status",
  requireAuth,
  validateBody(updateMissingStatusSchema),
  asyncHandler(async (req, res) => {
    const missingPerson = await prisma.missingPerson.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status }
    });

    await audit(req, "UPDATE_STATUS", "MissingPerson", missingPerson.id, { status: req.body.status });
    res.json({ missingPerson });
  })
);
