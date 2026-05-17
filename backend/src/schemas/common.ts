import { z } from "zod";

export const rawTokenSchema = z.string().length(64).regex(/^[a-f0-9]+$/);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});
