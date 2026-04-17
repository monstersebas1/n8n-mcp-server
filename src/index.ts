#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerWorkflowTools } from "./tools/workflows.js";
import { registerNodeTools } from "./tools/nodes.js";
import { registerExecutionTools } from "./tools/executions.js";
import { registerDebugTools } from "./tools/debug.js";
import { registerTemplateTools } from "./tools/templates.js";
import { registerBuilderTools } from "./tools/builder.js";
import { validateConfig } from "./lib/config.js";
import { RateLimiter } from "./lib/rate-limiter.js";

const config = validateConfig();
const rateLimiter = new RateLimiter();

const server = new McpServer({
  name: "n8n-workflow-builder",
  version: "0.1.0",
});

registerWorkflowTools(server, config);
registerNodeTools(server, config);
registerExecutionTools(server, config);
registerDebugTools(server, config);
registerTemplateTools(server, config);
registerBuilderTools(server, config);

server.tool(
  "check_usage",
  "Check current API usage stats for this connection (requests used, remaining, and tier)",
  {},
  async () => {
    const apiKey = config.n8nApiKey;
    const tier = config.tier;
    const used = rateLimiter.getUsage(apiKey);
    const check = rateLimiter.checkLimit(apiKey, tier);
    const stats = {
      tier,
      used,
      remaining: check.remaining === Infinity ? "unlimited" : check.remaining,
      total: check.total === Infinity ? "unlimited" : check.total,
      allowed: check.allowed,
    };
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
