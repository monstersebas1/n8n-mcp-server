import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";

export function registerWorkflowTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "list_workflows",
    "List all workflows in the n8n instance with their status, tags, and last update time",
    {},
    async () => {
      const workflows = await client.listWorkflows();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(workflows, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_workflow",
    "Get full details of a workflow including all nodes, connections, and settings",
    { workflowId: z.string().describe("The workflow ID") },
    async ({ workflowId }) => {
      const workflow = await client.getWorkflow(workflowId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(workflow, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "create_workflow",
    "Create a new n8n workflow. Provide a name and optionally nodes and connections. Returns the created workflow with its ID.",
    {
      name: z.string().describe("Name for the new workflow"),
      nodes: z
        .array(
          z.object({
            name: z.string(),
            type: z.string(),
            position: z.tuple([z.number(), z.number()]),
            parameters: z.record(z.unknown()).default({}),
          })
        )
        .optional()
        .describe("Array of nodes to add"),
      connections: z
        .record(z.record(z.array(z.array(z.object({
          node: z.string(),
          type: z.string(),
          index: z.number(),
        })))))
        .optional()
        .describe("Node connections map"),
    },
    async ({ name, nodes, connections }) => {
      const workflow = await client.createWorkflow({
        name,
        nodes: nodes as never,
        connections: connections as never,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(workflow, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "update_workflow",
    "Update an existing workflow's name, nodes, connections, or settings",
    {
      workflowId: z.string().describe("The workflow ID to update"),
      name: z.string().optional().describe("New name"),
      nodes: z
        .array(
          z.object({
            id: z.string().optional(),
            name: z.string(),
            type: z.string(),
            position: z.tuple([z.number(), z.number()]),
            parameters: z.record(z.unknown()).default({}),
          })
        )
        .optional()
        .describe("Updated nodes array"),
      connections: z
        .record(z.unknown())
        .optional()
        .describe("Updated connections"),
    },
    async ({ workflowId, ...updates }) => {
      const workflow = await client.updateWorkflow(
        workflowId,
        updates as never
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(workflow, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "delete_workflow",
    "Permanently delete a workflow. This cannot be undone.",
    { workflowId: z.string().describe("The workflow ID to delete") },
    async ({ workflowId }) => {
      await client.deleteWorkflow(workflowId);
      return {
        content: [
          {
            type: "text" as const,
            text: `Workflow ${workflowId} deleted successfully.`,
          },
        ],
      };
    }
  );

  server.tool(
    "activate_workflow",
    "Activate a workflow so it starts listening for triggers",
    { workflowId: z.string().describe("The workflow ID to activate") },
    async ({ workflowId }) => {
      const workflow = await client.activateWorkflow(workflowId);
      return {
        content: [
          {
            type: "text" as const,
            text: `Workflow "${workflow.name}" is now active.`,
          },
        ],
      };
    }
  );

  server.tool(
    "deactivate_workflow",
    "Deactivate a workflow so it stops listening for triggers",
    {
      workflowId: z
        .string()
        .describe("The workflow ID to deactivate"),
    },
    async ({ workflowId }) => {
      const workflow = await client.deactivateWorkflow(workflowId);
      return {
        content: [
          {
            type: "text" as const,
            text: `Workflow "${workflow.name}" is now inactive.`,
          },
        ],
      };
    }
  );
}
