import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().default('wamini_default_secret_key_minimum_32_characters_long_2026'),
  // Turso (optional in dev — uses local file)
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  // Vercel Blob (optional in dev)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

// Execute validation on load
const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.warn("⚠️ Warning: Invalid environment variables:", envParsed.error.format());
}

export const env = envParsed.success ? envParsed.data : ({} as any);
