import { z } from "zod";

export const loginSchema = z.object({
  badgeNumber: z.string().min(3).max(40),
  password: z.string().min(8).max(100)
});

export const createOfficerSchema = z.object({
  badgeNumber: z.string().min(3).max(40),
  password: z.string().min(8).max(100),
  role: z.enum(["OFFICER", "SUPERVISOR", "ADMIN"]).default("OFFICER")
});
