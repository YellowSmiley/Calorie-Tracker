import crypto, { createHash } from "crypto";

const DEFAULT_TOKEN_BYTES = 32;

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function createSecureToken(byteLength = DEFAULT_TOKEN_BYTES): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildTokenExpiry(hours: number, now = Date.now()): Date {
  return new Date(now + hours * 60 * 60 * 1000);
}

export function buildResetTokenIdentifier(email: string): string {
  return `reset:${normalizeEmail(email)}`;
}

export function getWeakPasswordMessage(
  password: string,
  minLength = 8,
): string | null {
  const requirements = [
    {
      regex: new RegExp(`.{${minLength},}`),
      message: `Password must be at least ${minLength} characters`,
    },
    {
      regex: /[A-Z]/,
      message: "Password must contain at least one uppercase letter",
    },
    {
      regex: /[a-z]/,
      message: "Password must contain at least one lowercase letter",
    },
    {
      regex: /[0-9]/,
      message: "Password must contain at least one number",
    },
    {
      regex: /[^A-Za-z0-9]/,
      message: "Password must contain at least one special character",
    },
  ];

  for (const requirement of requirements) {
    if (!requirement.regex.test(password)) {
      return requirement.message;
    }
  }

  return null;
}
