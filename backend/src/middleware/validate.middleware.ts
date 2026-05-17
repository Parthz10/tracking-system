import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request body", details: result.error.flatten() });
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid query", details: result.error.flatten() });
    }

    req.query = result.data;
    next();
  };
}
