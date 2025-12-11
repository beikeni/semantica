import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("cors", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete require.cache[require.resolve("../server/cors")];
    delete require.cache[require.resolve("../server/config")];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("returns production origins when in production", async () => {
    process.env.NODE_ENV = "production";
    const { getCorsOrigins } = await import("../server/cors");
    const origins = getCorsOrigins();
    
    expect(origins).toContain("https://www.semantica-portuguese.com");
    expect(origins).toContain("https://test.semantica-portuguese.com");
    expect(origins).not.toContain(null);
    expect(origins.length).toBe(2);
  });

  test("returns development origins with null for file:// when in development", async () => {
    process.env.NODE_ENV = "development";
    const { getCorsOrigins } = await import("../server/cors");
    const origins = getCorsOrigins();
    
    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("http://localhost:8080");
    expect(origins).toContain("http://localhost:8000");
    expect(origins).toContain("http://localhost:5173");
    expect(origins).toContain("http://127.0.0.1:3000");
    expect(origins).toContain(null); // for file://
  });

  test("formatCorsForDisplay formats origins correctly", async () => {
    const { formatCorsForDisplay } = await import("../server/cors");
    
    const withNull = ["http://localhost:3000", null] as (string | null)[];
    expect(formatCorsForDisplay(withNull)).toBe("http://localhost:3000, file://");
    
    const withoutNull = ["https://example.com", "https://test.com"];
    expect(formatCorsForDisplay(withoutNull)).toBe("https://example.com, https://test.com");
  });
});

