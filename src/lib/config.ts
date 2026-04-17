import { z } from "zod";

const configSchema = z.object({
  n8nBaseUrl: z
    .string()
    .url()
    .transform((url) => url.replace(/\/$/, "")),
  n8nApiKey: z.string().min(1),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  tier: z.enum(["free", "pro", "team"]).default("free"),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(): Config {
  const result = configSchema.safeParse({
    n8nBaseUrl: process.env.N8N_BASE_URL,
    n8nApiKey: process.env.N8N_API_KEY,
    logLevel: process.env.LOG_LEVEL,
    tier: process.env.TIER,
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Invalid configuration (${missing}). Check your .env file or environment variables.`
    );
  }

  return result.data;
}
