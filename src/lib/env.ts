import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Auth0 Strict Keys
  AUTH0_SECRET: z.string().min(32, "AUTH0_SECRET must be at least 32 characters"),
  AUTH0_BASE_URL: z.string().url("AUTH0_BASE_URL must be a valid URL"),
  AUTH0_ISSUER_BASE_URL: z.string().url("AUTH0_ISSUER_BASE_URL must be a valid URL"),
  AUTH0_CLIENT_ID: z.string().min(1, "AUTH0_CLIENT_ID is required"),
  AUTH0_CLIENT_SECRET: z.string().min(1, "AUTH0_CLIENT_SECRET is required"),
  // Turso (optional in dev — uses local file)
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  // Vercel Blob (optional in dev)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

// Execute validation on load
const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error("❌ CRITICAL: Invalid environment variables (Zero-Trust Boot Failure):", envParsed.error.format());
  process.exit(1); // Crash the build/runtime immediately
}

export const env = envParsed.data;
