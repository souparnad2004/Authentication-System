import { z } from "zod";

export const nodeEnvSchema = z
  .enum(["development", "test", "production"])
  .default("development");
export const portSchema = z.coerce.number().int().min(1).max(65535);
export const logLevelSchema = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace"])
  .default("info");
export const booleanSchema = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}
