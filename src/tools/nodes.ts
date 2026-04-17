import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { N8nClient } from "../lib/n8n-client.js";
import type { Config } from "../lib/config.js";

export function registerNodeTools(
  server: McpServer,
  config: Config
): void {
  const client = new N8nClient(config);

  server.tool(
    "search_nodes",
    "Search available n8n node types by name, category, or description. Use this to find the right node before adding it to a workflow.",
    {
      query: z
        .string()
        .describe(
          "Search term — node name, category, or description keyword"
        ),
    },
    async ({ query }) => {
      const nodeTypes = await client.getNodeTypes();
      const lowerQuery = query.toLowerCase();
      const matches = nodeTypes.filter(
        (nt) =>
          nt.displayName.toLowerCase().includes(lowerQuery) ||
          nt.name.toLowerCase().includes(lowerQuery) ||
          nt.description.toLowerCase().includes(lowerQuery) ||
          nt.group.some((g) => g.toLowerCase().includes(lowerQuery))
      );

      const summary = matches.map((nt) => ({
        name: nt.name,
        displayName: nt.displayName,
        description: nt.description,
        group: nt.group,
        inputs: nt.inputs,
        outputs: nt.outputs,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text:
              matches.length > 0
                ? JSON.stringify(summary, null, 2)
                : `No nodes found matching "${query}". Try a broader search term.`,
          },
        ],
      };
    }
  );

  server.tool(
    "add_node",
    "Add a node to an existing workflow. Specify the node type, name, position, and parameters.",
    {
      workflowId: z.string().describe("The workflow ID"),
      nodeType: z
        .string()
        .describe("The n8n node type (e.g., 'n8n-nodes-base.slack')"),
      nodeName: z
        .string()
        .describe("Display name for this node instance"),
      position: z
        .tuple([z.number(), z.number()])
        .describe("Canvas position [x, y]"),
      parameters: z
        .record(z.unknown())
        .default({})
        .describe("Node-specific parameters"),
    },
    async ({ workflowId, nodeType, nodeName, position, parameters }) => {
      const workflow = await client.getWorkflow(workflowId);

      const newNode = {
        id: crypto.randomUUID(),
        name: nodeName,
        type: nodeType,
        typeVersion: 1,
        position: position as [number, number],
        parameters,
      };

      workflow.nodes.push(newNode);
      const updated = await client.updateWorkflow(workflowId, {
        nodes: workflow.nodes,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Added "${nodeName}" (${nodeType}) to workflow "${updated.name}". Node ID: ${newNode.id}`,
          },
        ],
      };
    }
  );

  server.tool(
    "connect_nodes",
    "Connect two nodes in a workflow. Creates a connection from the source node's output to the target node's input.",
    {
      workflowId: z.string().describe("The workflow ID"),
      sourceNodeName: z
        .string()
        .describe("Name of the source node"),
      targetNodeName: z
        .string()
        .describe("Name of the target node"),
      sourceOutput: z
        .number()
        .default(0)
        .describe("Source output index (default 0)"),
      targetInput: z
        .number()
        .default(0)
        .describe("Target input index (default 0)"),
    },
    async ({
      workflowId,
      sourceNodeName,
      targetNodeName,
      sourceOutput,
      targetInput,
    }) => {
      const workflow = await client.getWorkflow(workflowId);

      const connections = workflow.connections ?? {};
      if (!connections[sourceNodeName]) {
        connections[sourceNodeName] = {};
      }
      const outputKey = "main";
      if (!connections[sourceNodeName][outputKey]) {
        connections[sourceNodeName][outputKey] = [];
      }

      while (connections[sourceNodeName][outputKey].length <= sourceOutput) {
        connections[sourceNodeName][outputKey].push([]);
      }

      connections[sourceNodeName][outputKey][sourceOutput].push({
        node: targetNodeName,
        type: "main",
        index: targetInput,
      });

      await client.updateWorkflow(workflowId, { connections });

      return {
        content: [
          {
            type: "text" as const,
            text: `Connected "${sourceNodeName}" → "${targetNodeName}" in workflow ${workflowId}.`,
          },
        ],
      };
    }
  );

  server.tool(
    "configure_node",
    "Update the parameters of an existing node in a workflow",
    {
      workflowId: z.string().describe("The workflow ID"),
      nodeName: z
        .string()
        .describe("Name of the node to configure"),
      parameters: z
        .record(z.unknown())
        .describe("Parameters to set or update"),
    },
    async ({ workflowId, nodeName, parameters }) => {
      const workflow = await client.getWorkflow(workflowId);
      const node = workflow.nodes.find((n) => n.name === nodeName);

      if (!node) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Node "${nodeName}" not found in workflow. Available nodes: ${workflow.nodes.map((n) => n.name).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      node.parameters = { ...node.parameters, ...parameters };
      await client.updateWorkflow(workflowId, { nodes: workflow.nodes });

      return {
        content: [
          {
            type: "text" as const,
            text: `Updated parameters for "${nodeName}": ${JSON.stringify(parameters)}`,
          },
        ],
      };
    }
  );
}
