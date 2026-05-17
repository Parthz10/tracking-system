import { z } from "zod";
import { rawTokenSchema } from "./common.js";

export const createReportSchema = z.object({
  token: rawTokenSchema,
  type: z.enum(["CRIME", "MISSING_PERSON", "SUSPICIOUS_ACTIVITY", "TRAFFICKING", "OTHER"]),
  description: z.string().min(20).max(5000),
  district: z.string().min(2).max(80).optional(),
  municipality: z.string().min(2).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

export const reportListQuerySchema = z.object({
  status: z.enum(["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  type: z.enum(["CRIME", "MISSING_PERSON", "SUSPICIOUS_ACTIVITY", "TRAFFICKING", "OTHER"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  district: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const updateStatusSchema = z.object({
  status: z.enum(["RECEIVED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  note: z.string().max(1000).optional()
});

export const updatePrioritySchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"])
});

export const assignReportSchema = z.object({
  badgeNumber: z.string().min(3).max(40)
});
