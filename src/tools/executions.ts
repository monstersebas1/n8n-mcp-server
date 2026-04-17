import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";

export function registerExecutionTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "execute_workflow",
    "Execute a workflow immediately and return the results. Optionally pass input data for the trigger node.",
    {
      workflowId: z.string().describe("The workflow ID to execute"),
      inputData: z
        .record(z.unknown())
        .optional()
        .describe("Input data to pass to the workflow trigger"),
    },
    async ({ workflowId, inputData }) => {
      const execution = await client.executeWorkflow(
        workflowId,
        inputData
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                executionId: execution.id,
                status: execution.status,
                startedAt: execution.startedAt,
                stoppedAt: execution.stoppedAt,
                data: execution.data?.resultData?.runData
                  ? "Execution completed — use get_execution for full data"
                  : undefined,
                error: execution.data?.resultData?.error?.message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "list_executions",
    "List recent workflow executions with their status. Optionally filter by workflow ID.",
    {
      workflowId: z
        .string()
        .optional()
        .describe("Filter by workflow ID"),
    },
    async ({ workflowId }) => {
      const executions = await client.listExecutions(workflowId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(executions, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_execution",
    "Get full execution details including per-node results, timing, and error information",
    {
      executionId: z.string().describe("The execution ID"),
    },
    async ({ executionId }) => {
      const execution = await client.getExecution(executionId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(execution, null, 2),
          },
        ],
      };
    }
  );
}
