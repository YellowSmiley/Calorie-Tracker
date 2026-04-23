import { z } from "zod";

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const runtimeEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    DATABASE_URL: z
      .string()
      .trim()
      .min(1, "DATABASE_URL is required")
      .refine((value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }, "DATABASE_URL must be a valid database connection URL"),
    AUTH_GOOGLE_ID: z.string().trim().min(1, "AUTH_GOOGLE_ID is required"),
    AUTH_GOOGLE_SECRET: z
      .string()
      .trim()
      .min(1, "AUTH_GOOGLE_SECRET is required"),
    AUTH_SECRET: z
      .string()
      .min(32, "AUTH_SECRET must be at least 32 characters long"),
    AUTH_URL: z
      .string()
      .trim()
      .min(1, "AUTH_URL is required")
      .refine((value) => {
        try {
          const parsed = new URL(value);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      }, "AUTH_URL must be a valid http(s) URL"),
    SMTP_HOST: z.string().trim().min(1, "SMTP_HOST is required"),
    SMTP_PORT: z
      .string()
      .trim()
      .refine((value) => /^\d+$/.test(value), "SMTP_PORT must be a number")
      .refine((value) => {
        const port = Number(value);
        return Number.isInteger(port) && port >= 1 && port <= 65535;
      }, "SMTP_PORT must be between 1 and 65535"),
    SMTP_SECURE: z.enum(["true", "false"], {
      error: "SMTP_SECURE must be either 'true' or 'false'",
    }),
    SMTP_USER: z.string().trim().min(1, "SMTP_USER is required"),
    SMTP_PASSWORD: z.string().trim().min(1, "SMTP_PASSWORD is required"),
    SMTP_FROM: z
      .string()
      .trim()
      .email("SMTP_FROM must be a valid email address"),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV !== "production") {
      return;
    }

    const authUrl = new URL(env.AUTH_URL);
    if (
      authUrl.protocol !== "https:" &&
      !LOCALHOST_HOSTNAMES.has(authUrl.hostname)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_URL"],
        message: "AUTH_URL must use https in production",
      });
    }
  });

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

let cachedRuntimeEnv: RuntimeEnv | null = null;

export function parseRuntimeEnv(env: NodeJS.ProcessEnv): RuntimeEnv {
  return runtimeEnvSchema.parse(env);
}

function formatRuntimeEnvError(error: z.ZodError): string {
  const details = error.issues
    .map((issue) => {
      const key = issue.path.join(".") || "env";
      return `- ${key}: ${issue.message}`;
    })
    .join("\n");

  return `Invalid runtime environment configuration:\n${details}`;
}

export function getRuntimeEnv(): RuntimeEnv {
  if (cachedRuntimeEnv) {
    return cachedRuntimeEnv;
  }

  const parsed = runtimeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(formatRuntimeEnvError(parsed.error));
  }

  cachedRuntimeEnv = parsed.data;
  return cachedRuntimeEnv;
}
