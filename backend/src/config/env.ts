import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("8h"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("safetyapp-media")
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
