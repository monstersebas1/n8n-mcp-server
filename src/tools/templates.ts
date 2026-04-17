import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";
import { templates } from "../templates/index.js";

export function registerTemplateTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "list_templates",
    "Browse pre-built workflow templates. Each template is a proven automation pattern ready to deploy.",
    {
      category: z
        .string()
        .optional()
        .describe("Filter by category (e.g., 'email', 'crm', 'social')"),
    },
    async ({ category }) => {
      const filtered = category
        ? templates.filter((t) =>
            t.category.toLowerCase().includes(category.toLowerCase())
          )
        : templates;

      const summary = filtered.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        nodeCount: t.workflow.nodes.length,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text:
              summary.length > 0
                ? JSON.stringify(summary, null, 2)
                : `No templates found${category ? ` for category "${category}"` : ""}. Available categories: ${[...new Set(templates.map((t) => t.category))].join(", ")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "apply_template",
    "Deploy a pre-built template to your n8n instance as a new workflow. You can customize the name.",
    {
      templateId: z.string().describe("The template ID to deploy"),
      workflowName: z
        .string()
        .optional()
        .describe("Custom name for the created workflow"),
    },
    async ({ templateId, workflowName }) => {
      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Template "${templateId}" not found. Use list_templates to see available templates.`,
            },
          ],
          isError: true,
        };
      }

      const workflow = await client.createWorkflow({
        name: workflowName ?? template.name,
        nodes: template.workflow.nodes,
        connections: template.workflow.connections,
        settings: template.workflow.settings,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Template "${template.name}" deployed as workflow "${workflow.name}" (ID: ${workflow.id}). Use activate_workflow to turn it on.`,
          },
        ],
      };
    }
  );
}
