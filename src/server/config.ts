import { join } from "path";

// Load .env file (Bun has built-in dotenv support)
const envPath = process.env.STA_ENV_PATH ?? join(import.meta.dir, "..", "..", ".env");
Bun.env.NODE_ENV ??= "development";

export const config = {
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 1337,
  host: process.env.NODE_ENV === "production" ? "127.0.0.1" : "localhost",
  envPath,
  azure: {
    speechKey: process.env.AZURE_SPEECH_KEY ?? "",
    speechRegion: process.env.AZURE_SPEECH_REGION ?? "",
  },
} as const;

export type Config = typeof config;

export function validateConfig(): void {
  if (!config.azure.speechKey || !config.azure.speechRegion) {
    console.error("Azure Speech credentials not found in environment variables");
    process.exit(1);
  }
}

