import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";

export function registerDebugTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "debug_workflow",
    "Analyze a workflow for errors and issues. Checks recent executions for failures, validates node connections, and suggests fixes.",
    {
      workflowId: z.string().describe("The workflow ID to debug"),
    },
    async ({ workflowId }) => {
      const [workflow, executions] = await Promise.all([
        client.getWorkflow(workflowId),
        client.listExecutions(workflowId),
      ]);

      const issues: string[] = [];

      if (workflow.nodes.length === 0) {
        issues.push("Workflow has no nodes.");
      }

      const connectedNodes = new Set<string>();
      for (const [sourceName, outputs] of Object.entries(
        workflow.connections
      )) {
        connectedNodes.add(sourceName);
        for (const connectionArrays of Object.values(outputs)) {
          for (const connections of connectionArrays) {
            for (const conn of connections) {
              connectedNodes.add(conn.node);
            }
          }
        }
      }

      const disconnected = workflow.nodes.filter(
        (n) => !connectedNodes.has(n.name)
      );
      if (disconnected.length > 0) {
        issues.push(
          `Disconnected nodes: ${disconnected.map((n) => n.name).join(", ")}`
        );
      }

      const hasTrigger = workflow.nodes.some(
        (n) =>
          n.type.includes("Trigger") ||
          n.type.includes("trigger") ||
          n.type.includes("webhook")
      );
      if (!hasTrigger) {
        issues.push(
          "No trigger node found. Workflow needs a trigger to start automatically."
        );
      }

      const recentFailures = executions
        .filter((e) => e.status === "error")
        .slice(0, 5);

      const failureDetails = await Promise.all(
        recentFailures.map((e) => client.getExecution(e.id))
      );

      const errors = failureDetails
        .map((e) => ({
          executionId: e.id,
          startedAt: e.startedAt,
          error: e.data?.resultData?.error?.message ?? "Unknown error",
          failedNodes: e.data?.resultData?.runData
            ? Object.entries(e.data.resultData.runData)
                .filter(([, data]) => data.some((d) => d.error))
                .map(([nodeName, data]) => ({
                  node: nodeName,
                  error: data.find((d) => d.error)?.error?.message,
                }))
            : [],
        }))
        .filter((e) => e.error || e.failedNodes.length > 0);

      const report = {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          nodeCount: workflow.nodes.length,
        },
        structuralIssues: issues.length > 0 ? issues : "None found",
        recentErrors:
          errors.length > 0 ? errors : "No recent failures",
        suggestions: buildSuggestions(issues, errors),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    }
  );
}

function buildSuggestions(
  issues: string[],
  errors: Array<{ error: string; failedNodes: unknown[] }>
): string[] {
  const suggestions: string[] = [];

  if (issues.some((i) => i.includes("Disconnected"))) {
    suggestions.push(
      "Connect disconnected nodes using the connect_nodes tool."
    );
  }

  if (issues.some((i) => i.includes("No trigger"))) {
    suggestions.push(
      "Add a trigger node (webhook, schedule, or app trigger) to start the workflow."
    );
  }

  if (errors.length > 0) {
    suggestions.push(
      "Check credentials for failing nodes — authentication errors are the most common cause."
    );
    suggestions.push(
      "Use get_execution with a failed execution ID to see the full error stack trace."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Workflow looks healthy. No issues detected.");
  }

  return suggestions;
}
