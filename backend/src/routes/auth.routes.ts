import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { OfficerRole } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createOfficerSchema, loginSchema } from "../schemas/auth.schema.js";
import { audit } from "../services/audit.service.js";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const officer = await prisma.officer.findUnique({ where: { badgeNumber: req.body.badgeNumber } });

    if (!officer || !officer.active) throw new HttpError(401, "Invalid credentials");

    const valid = await bcrypt.compare(req.body.password, officer.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid credentials");

    const token = jwt.sign(
      { badgeNumber: officer.badgeNumber, role: officer.role },
      env.JWT_SECRET,
      { subject: officer.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );

    await audit(req, "LOGIN", "Officer", officer.id);
    res.json({ token, officer: { badgeNumber: officer.badgeNumber, role: officer.role } });
  })
);

authRoutes.post(
  "/officers",
  requireAuth,
  requireRole(OfficerRole.ADMIN),
  validateBody(createOfficerSchema),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const officer = await prisma.officer.create({
      data: {
        badgeNumber: req.body.badgeNumber,
        passwordHash,
        role: req.body.role
      },
      select: { id: true, badgeNumber: true, role: true, active: true, createdAt: true }
    });

    await audit(req, "CREATE", "Officer", officer.id, { badgeNumber: officer.badgeNumber, role: officer.role });
    res.status(201).json({ officer });
  })
);

authRoutes.delete(
  "/officers/:id",
  requireAuth,
  requireRole(OfficerRole.ADMIN),
  asyncHandler(async (req, res) => {
    const officer = await prisma.officer.update({
      where: { id: req.params.id as string },
      data: { active: false },
      select: { id: true, badgeNumber: true, active: true }
    });

    await audit(req, "DEACTIVATE", "Officer", officer.id, { badgeNumber: officer.badgeNumber });
    res.json({ officer });
  })
);
