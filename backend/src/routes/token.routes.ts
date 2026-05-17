import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { publicRateLimit } from "../middleware/rate-limit.middleware.js";
import { createAnonymousToken } from "../services/anonymiser.service.js";

export const tokenRoutes = Router();

tokenRoutes.post(
  "/",
  publicRateLimit,
  asyncHandler(async (_req, res) => {
    const { token } = await createAnonymousToken();
    res.status(201).json({ token });
  })
);
