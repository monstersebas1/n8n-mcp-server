# n8n MCP Server

An MCP server that lets AI assistants create, debug, test, and deploy n8n workflows through natural language. Not just read — actually build.

## What It Does

Connect this MCP server to Claude, Cursor, Windsurf, or any MCP-compatible AI assistant. Then ask it to build automations:

- "Create a workflow that sends me a Slack message when a new lead comes into HubSpot"
- "Debug why my invoice workflow is failing"
- "Optimize my email sequence workflow — it's running slow"
- "Show me all workflows that ran in the last 24 hours and flag any failures"

The AI assistant talks to your n8n instance through this server and does the work.

## Install

```bash
npm install -g @weautomatehq/n8n-mcp-server
```

## Connect to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "npx",
      "args": ["@weautomatehq/n8n-mcp-server"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Connect to Claude Code

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "npx",
      "args": ["@weautomatehq/n8n-mcp-server"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Workflow Management
- `list_workflows` — List all workflows with status and tags
- `get_workflow` — Get full workflow details including nodes and connections
- `create_workflow` — Create a new workflow from scratch or description
- `update_workflow` — Modify an existing workflow
- `delete_workflow` — Delete a workflow
- `activate_workflow` — Turn a workflow on
- `deactivate_workflow` — Turn a workflow off

### Node Operations
- `search_nodes` — Find available n8n nodes by name or category
- `add_node` — Add a node to a workflow
- `connect_nodes` — Wire two nodes together
- `configure_node` — Set node parameters

### Execution & Debugging
- `execute_workflow` — Run a workflow and return results
- `list_executions` — View past executions with status
- `get_execution` — Get detailed execution data including errors
- `debug_workflow` — Analyze a failing workflow and suggest fixes

### Templates
- `list_templates` — Browse pre-built workflow templates
- `apply_template` — Deploy a template to your n8n instance

## Pricing

- **Free:** 5 requests to try it out
- **Pro:** $19/month — unlimited requests, all tools
- **Team:** $49/month — multiple n8n instances, priority support

## License

Proprietary — WeAutomateHQ
