import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { mkdir, rm, readFile } from "fs/promises";
import { join } from "path";

const LOG_DIR = join(import.meta.dir, "..", "..", "logs");

describe("logger", () => {
  beforeEach(async () => {
    // Clean up logs directory before each test
    try {
      await rm(LOG_DIR, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    // Clear module cache
    delete require.cache[require.resolve("../server/logger")];
  });

  afterEach(async () => {
    try {
      await rm(LOG_DIR, { recursive: true, force: true });
    } catch {
      // Cleanup
    }
  });

  test("logger has all required methods", async () => {
    const { logger } = await import("../server/logger");
    
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.server).toBe("function");
  });

  test("logger.info writes to info.log", async () => {
    const { logger } = await import("../server/logger");
    
    await logger.info("Test info message");
    
    const content = await readFile(join(LOG_DIR, "info.log"), "utf-8");
    const entry = JSON.parse(content.trim());
    
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("Test info message");
    expect(entry.timestamp).toBeDefined();
  });

  test("logger.error writes to error.log", async () => {
    const { logger } = await import("../server/logger");
    
    await logger.error("Test error message");
    
    const content = await readFile(join(LOG_DIR, "error.log"), "utf-8");
    const entry = JSON.parse(content.trim());
    
    expect(entry.level).toBe("error");
    expect(entry.message).toBe("Test error message");
  });

  test("logger.warn writes to warn.log", async () => {
    const { logger } = await import("../server/logger");
    
    await logger.warn("Test warn message");
    
    const content = await readFile(join(LOG_DIR, "warn.log"), "utf-8");
    const entry = JSON.parse(content.trim());
    
    expect(entry.level).toBe("warn");
    expect(entry.message).toBe("Test warn message");
  });

  test("logger.server writes to server.log", async () => {
    const { logger } = await import("../server/logger");
    
    await logger.server("Test server message");
    
    const content = await readFile(join(LOG_DIR, "server.log"), "utf-8");
    const entry = JSON.parse(content.trim());
    
    expect(entry.level).toBe("server");
    expect(entry.message).toBe("Test server message");
  });

  test("timestamp returns formatted date string", async () => {
    const { timestamp } = await import("../server/logger");
    const ts = timestamp();
    
    expect(typeof ts).toBe("string");
    expect(ts.length).toBeGreaterThan(0);
    // Should contain date and time parts
    expect(ts).toMatch(/\d/);
  });
});

