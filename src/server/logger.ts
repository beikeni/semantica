import { appendFile, mkdir } from "fs/promises";
import { join } from "path";

type LogLevel = "error" | "warn" | "server" | "info";

const LOG_DIR = join(import.meta.dir, "..", "..", "logs");
const LOG_FILES: Record<LogLevel, string> = {
  error: join(LOG_DIR, "error.log"),
  warn: join(LOG_DIR, "warn.log"),
  server: join(LOG_DIR, "server.log"),
  info: join(LOG_DIR, "info.log"),
};

let initialized = false;

async function ensureLogDir(): Promise<void> {
  if (initialized) return;
  await mkdir(LOG_DIR, { recursive: true });
  initialized = true;
}

function formatMessage(level: LogLevel, message: string): string {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(entry) + "\n";
}

async function writeLog(level: LogLevel, message: string): Promise<void> {
  await ensureLogDir();
  await appendFile(LOG_FILES[level], formatMessage(level, message));
}

export const logger = {
  error: (msg: string) => writeLog("error", msg),
  warn: (msg: string) => writeLog("warn", msg),
  server: (msg: string) => writeLog("server", msg),
  info: (msg: string) => writeLog("info", msg),
};

export function timestamp(): string {
  const d = new Date();
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

