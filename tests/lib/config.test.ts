import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateConfig } from "../../src/lib/config.js";

describe("validateConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config when both required env vars are present", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_API_KEY = "my-api-key";

    const config = validateConfig();

    expect(config.n8nBaseUrl).toBe("https://n8n.example.com");
    expect(config.n8nApiKey).toBe("my-api-key");
  });

  it("throws with helpful message when N8N_BASE_URL is missing", () => {
    delete process.env.N8N_BASE_URL;
    process.env.N8N_API_KEY = "my-api-key";

    expect(() => validateConfig()).toThrow(/n8nBaseUrl/);
  });

  it("throws with helpful message when N8N_API_KEY is missing", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    delete process.env.N8N_API_KEY;

    expect(() => validateConfig()).toThrow(/n8nApiKey/);
  });

  it("throws when N8N_BASE_URL is not a valid URL", () => {
    process.env.N8N_BASE_URL = "not-a-url";
    process.env.N8N_API_KEY = "my-api-key";

    expect(() => validateConfig()).toThrow();
  });

  it("strips trailing slash from URL", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com/";
    process.env.N8N_API_KEY = "my-api-key";

    const config = validateConfig();

    expect(config.n8nBaseUrl).toBe("https://n8n.example.com");
  });

  it("strips multiple trailing slashes from URL", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com///";
    process.env.N8N_API_KEY = "my-api-key";

    const config = validateConfig();
    expect(config.n8nBaseUrl).toBe("https://n8n.example.com//");
  });

  it("defaults logLevel to info when LOG_LEVEL is not set", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_API_KEY = "my-api-key";
    delete process.env.LOG_LEVEL;

    const config = validateConfig();

    expect(config.logLevel).toBe("info");
  });

  it("accepts a valid LOG_LEVEL override", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_API_KEY = "my-api-key";
    process.env.LOG_LEVEL = "debug";

    const config = validateConfig();

    expect(config.logLevel).toBe("debug");
  });

  it("throws when LOG_LEVEL is an invalid value", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_API_KEY = "my-api-key";
    process.env.LOG_LEVEL = "verbose";

    expect(() => validateConfig()).toThrow();
  });

  it("defaults tier to free when TIER is not set", () => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_API_KEY = "my-api-key";
    delete process.env.TIER;

    const config = validateConfig();

    expect(config.tier).toBe("free");
  });

  it("includes env vars reference in error message", () => {
    delete process.env.N8N_BASE_URL;
    delete process.env.N8N_API_KEY;

    expect(() => validateConfig()).toThrow(/\.env file or environment variables/);
  });
});
