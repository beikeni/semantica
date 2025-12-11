import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset module cache to reload config with fresh env
    delete require.cache[require.resolve("../server/config")];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("isProduction is false when NODE_ENV is not production", async () => {
    process.env.NODE_ENV = "development";
    const { config } = await import("../server/config");
    expect(config.isProduction).toBe(false);
  });

  test("isProduction is true when NODE_ENV is production", async () => {
    process.env.NODE_ENV = "production";
    const { config } = await import("../server/config");
    expect(config.isProduction).toBe(true);
  });

  test("port defaults to 1337", async () => {
    delete process.env.PORT;
    const { config } = await import("../server/config");
    expect(config.port).toBe(1337);
  });

  test("port can be overridden via PORT env var", async () => {
    process.env.PORT = "8080";
    const { config } = await import("../server/config");
    expect(config.port).toBe(8080);
  });

  test("host is localhost in development", async () => {
    process.env.NODE_ENV = "development";
    const { config } = await import("../server/config");
    expect(config.host).toBe("localhost");
  });

  test("host is 127.0.0.1 in production", async () => {
    process.env.NODE_ENV = "production";
    const { config } = await import("../server/config");
    expect(config.host).toBe("127.0.0.1");
  });

  test("azure credentials are read from env", async () => {
    process.env.AZURE_SPEECH_KEY = "test-key";
    process.env.AZURE_SPEECH_REGION = "test-region";
    const { config } = await import("../server/config");
    expect(config.azure.speechKey).toBe("test-key");
    expect(config.azure.speechRegion).toBe("test-region");
  });

  test("azure credentials default to empty string", async () => {
    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;
    const { config } = await import("../server/config");
    expect(config.azure.speechKey).toBe("");
    expect(config.azure.speechRegion).toBe("");
  });
});

