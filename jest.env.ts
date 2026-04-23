const requiredTestEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/calorie_tracker",
  AUTH_GOOGLE_ID: "test-google-client-id",
  AUTH_GOOGLE_SECRET: "test-google-client-secret",
  AUTH_SECRET: "12345678901234567890123456789012",
  AUTH_URL: "http://localhost:3000",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "smtp-user",
  SMTP_PASSWORD: "smtp-password",
  SMTP_FROM: "noreply@example.com",
};

for (const [key, value] of Object.entries(requiredTestEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
