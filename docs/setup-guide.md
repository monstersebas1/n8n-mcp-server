# Setup Guide

## Prerequisites

- Node.js 20+
- An n8n instance with API access enabled
- An n8n API key

## Getting Your n8n API Key

1. Open your n8n instance
2. Go to Settings > API
3. Create a new API key
4. Copy the key — you'll need it in the next step

## Installation

```bash
cd products/n8n-mcp-server
npm install
cp .env.example .env
```

Edit `.env` and add your n8n details:

```
N8N_BASE_URL=https://your-n8n.com
N8N_API_KEY=your-key-here
```

## Build & Run

```bash
npm run build
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Connect to Claude Desktop

Add this to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n.com",
        "N8N_API_KEY": "your-key-here"
      }
    }
  }
}
```

Restart Claude Desktop after adding the config.

## Connect to Claude Code

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "N8N_BASE_URL": "https://your-n8n.com",
        "N8N_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Connect to Cursor

Add to Cursor's MCP settings (Settings > MCP Servers):

```json
{
  "n8n-workflow-builder": {
    "command": "node",
    "args": ["/absolute/path/to/dist/index.js"],
    "env": {
      "N8N_BASE_URL": "https://your-n8n.com",
      "N8N_API_KEY": "your-key-here"
    }
  }
}
```

## Verify It Works

After connecting, ask your AI assistant:

> "List all my n8n workflows"

If it returns your workflow list, you're connected.
