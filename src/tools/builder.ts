import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";
import {
  buildWorkflow,
  suggestWorkflow,
  getCatalogSummary,
} from "../lib/workflow-builder.js";
import { findNodesByIntent } from "../lib/node-catalog.js";

export function registerBuilderTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "build_workflow_from_description",
    `The star tool. Describe what you want automated in plain English and this tool builds a complete n8n workflow — picks the right nodes, wires them together, sets parameters, and deploys it to your n8n instance. Examples:
    - "Every morning, check my email and send a Slack summary"
    - "When a webhook receives data, save it to Supabase and notify me on Telegram"
    - "Every hour, call an API, filter the results, and add new rows to Google Sheets"`,
    {
      description: z
        .string()
        .describe(
          "Plain English description of the automation you want. Be specific about triggers (when), actions (what), and destinations (where)."
        ),
      workflowName: z
        .string()
        .optional()
        .describe("Custom name for the workflow. Auto-generated if not provided."),
      deploy: z
        .boolean()
        .default(true)
        .describe("Deploy to n8n immediately (true) or just return the plan (false)"),
    },
    async ({ description, workflowName, deploy }) => {
      const plan = suggestWorkflow(description);
      if (workflowName) {
        plan.name = workflowName;
      }

      const built = buildWorkflow(plan);

      if (built.nodes.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Could not build a workflow from that description. Try being more specific about:\n- **Trigger:** When should this run? (schedule, webhook, email, manual)\n- **Actions:** What should happen? (send slack, save to database, call API)\n- **Destination:** Where should the result go? (Supabase, Google Sheets, email)\n\nAvailable integrations:\n${getCatalogSummary()}`,
            },
          ],
          isError: true,
        };
      }

      const credentialsNeeded = built.explanation
        .filter((e) => e.includes("requires"))
        .map((e) => e.match(/requires (\w+) credentials/)?.[1])
        .filter(Boolean);

      if (!deploy) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  plan: {
                    name: built.name,
                    steps: built.explanation,
                    credentialsNeeded:
                      credentialsNeeded.length > 0
                        ? credentialsNeeded
                        : "None",
                  },
                  workflow: {
                    nodes: built.nodes.map((n) => ({
                      name: n.name,
                      type: n.type,
                    })),
                    connections: Object.entries(built.connections).map(
                      ([from, outputs]) => {
                        const targets = Object.values(outputs)
                          .flat()
                          .flat()
                          .map((c) => c.node);
                        return `${from} → ${targets.join(", ")}`;
                      }
                    ),
                  },
                  note: "Use deploy=true to create this workflow on your n8n instance.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const created = await client.createWorkflow({
        name: built.name,
        nodes: built.nodes,
        connections: built.connections,
        settings: built.settings,
      });

      const response = {
        status: "Workflow created successfully",
        workflowId: created.id,
        name: created.name,
        steps: built.explanation,
        nodeCount: built.nodes.length,
        credentialsNeeded:
          credentialsNeeded.length > 0
            ? `Configure these credentials in n8n before activating: ${credentialsNeeded.join(", ")}`
            : "No credentials needed",
        nextSteps: [
          credentialsNeeded.length > 0
            ? `Set up credentials (${credentialsNeeded.join(", ")}) in your n8n instance`
            : null,
          "Review and customize node parameters as needed",
          `Activate with: activate_workflow(workflowId: "${created.id}")`,
        ].filter(Boolean),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "suggest_nodes",
    "Describe what you want to do and get recommended n8n nodes with their configurations. Use this to explore what's possible before building a workflow.",
    {
      intent: z
        .string()
        .describe(
          "What you want to accomplish — e.g., 'send notifications', 'store data', 'process webhooks'"
        ),
    },
    async ({ intent }) => {
      const matches = findNodesByIntent(intent);

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No matching nodes found for "${intent}". Try broader terms like: email, slack, database, api, schedule, filter, transform.\n\nFull catalog:\n${getCatalogSummary()}`,
            },
          ],
        };
      }

      const suggestions = matches.slice(0, 5).map((node) => ({
        type: node.type,
        name: node.displayName,
        category: node.category,
        description: node.description,
        availableConfigs: Object.entries(node.commonConfigs).map(
          ([key, config]) => ({
            name: key,
            description: config.description,
            needsCredentials: config.credentials ?? "none",
          })
        ),
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(suggestions, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_catalog",
    "Get the full catalog of available n8n node types organized by category. Use this to see all integrations this server supports.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: getCatalogSummary(),
          },
        ],
      };
    }
  );
}
