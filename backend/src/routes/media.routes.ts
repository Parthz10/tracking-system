import multer from "multer";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { publicRateLimit } from "../middleware/rate-limit.middleware.js";
import { findAnonymousToken } from "../services/anonymiser.service.js";
import { sanitiseImage, scanMedia, uploadMedia } from "../services/media.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const mediaRoutes = Router();

mediaRoutes.post(
  "/upload",
  publicRateLimit,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const anonymousToken = await findAnonymousToken(token);
    if (!anonymousToken) throw new HttpError(400, "Unknown anonymous token");
    if (!req.file) throw new HttpError(400, "Missing file");

    const safe = await scanMedia(req.file.buffer);
    if (!safe) throw new HttpError(400, "Media failed malware scan");

    const sanitised = await sanitiseImage(req.file.buffer, req.file.mimetype);
    const objectKey = await uploadMedia(sanitised, req.file.mimetype);

    const media = await prisma.media.create({
      data: {
        objectKey,
        mimeType: req.file.mimetype,
        sizeBytes: sanitised.length,
        scanStatus: "PASSED",
        safe: true
      }
    });

    res.status(201).json({ media });
  })
);
