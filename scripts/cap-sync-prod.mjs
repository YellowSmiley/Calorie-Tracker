import { config } from "dotenv";
import { spawn } from "node:child_process";

const platform = process.argv[2];

if (!platform || (platform !== "android" && platform !== "ios")) {
  console.error("Usage: node scripts/cap-sync-prod.mjs <android|ios>");
  process.exit(1);
}

config({ path: ".env.production" });

const serverUrl = (process.env.CAP_SERVER_URL || "").trim();
if (!serverUrl) {
  console.error("CAP_SERVER_URL is missing in .env.production");
  process.exit(1);
}

process.env.CAP_SERVER_URL = serverUrl;

const child = spawn("npx", ["cap", "sync", platform], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
