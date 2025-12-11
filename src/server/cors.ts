import { config } from "./config";

const PRODUCTION_ORIGINS = [
  "https://www.semantica-portuguese.com",
  "https://test.semantica-portuguese.com",
];

const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:5173",
];

export function getCorsOrigins(): (string | null)[] {
  if (config.isProduction) {
    return PRODUCTION_ORIGINS;
  }
  // Include null for file:// protocol in development
  return [...DEVELOPMENT_ORIGINS, null];
}

export function formatCorsForDisplay(origins: (string | null)[]): string {
  const filtered = origins.filter((o): o is string => o !== null);
  const hasNull = origins.includes(null);
  return filtered.join(", ") + (hasNull ? ", file://" : "");
}

