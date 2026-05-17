import { z } from "zod";
import { rawTokenSchema } from "./common.js";

export const createMissingPersonSchema = z.object({
  token: rawTokenSchema,
  name: z.string().min(2).max(160),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.string().max(40).optional(),
  lastSeenLocation: z.string().min(3).max(240),
  district: z.string().min(2).max(80).optional(),
  photoObjectKey: z.string().max(240).optional()
});

export const missingPersonQuerySchema = z.object({
  district: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const updateMissingStatusSchema = z.object({
  status: z.enum(["ACTIVE", "FOUND", "CLOSED"])
});
