/** @jest-environment node */
import { describe, expect, test } from "@jest/globals";
import { parseRuntimeEnv } from "./runtimeEnv";

const validEnv = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://user:password@localhost:5432/calorie_tracker",
  AUTH_GOOGLE_ID: "google-client-id",
  AUTH_GOOGLE_SECRET: "google-client-secret",
  AUTH_SECRET: "12345678901234567890123456789012",
  AUTH_URL: "http://localhost:3000",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "smtp-user",
  SMTP_PASSWORD: "smtp-password",
  SMTP_FROM: "noreply@example.com",
} satisfies Partial<NodeJS.ProcessEnv>;

describe("parseRuntimeEnv", () => {
  test("accepts a valid runtime environment", () => {
    expect(parseRuntimeEnv(validEnv)).toMatchObject(validEnv);
  });

  test("throws when a required variable is missing", () => {
    expect(() =>
      parseRuntimeEnv({
        ...validEnv,
        AUTH_GOOGLE_SECRET: "",
      }),
    ).toThrow("AUTH_GOOGLE_SECRET is required");
  });

  test("throws when AUTH_URL is not a valid URL", () => {
    expect(() =>
      parseRuntimeEnv({
        ...validEnv,
        AUTH_URL: "not-a-url",
      }),
    ).toThrow("AUTH_URL must be a valid http(s) URL");
  });

  test("throws when AUTH_URL is not https in production", () => {
    expect(() =>
      parseRuntimeEnv({
        ...validEnv,
        NODE_ENV: "production",
        AUTH_URL: "http://calorie-tracker.example.com",
      }),
    ).toThrow("AUTH_URL must use https in production");
  });

  test("throws when AUTH_SECRET is too short", () => {
    expect(() =>
      parseRuntimeEnv({
        ...validEnv,
        AUTH_SECRET: "too-short",
      }),
    ).toThrow("AUTH_SECRET must be at least 32 characters long");
  });
});