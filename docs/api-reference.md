# API Reference — MCP Tools

## Workflow Management

### list_workflows
Lists all workflows with status, tags, and timestamps.
- **Parameters:** none
- **Returns:** Array of workflow summaries

### get_workflow
Gets full workflow details including nodes and connections.
- **Parameters:** `workflowId` (string, required)
- **Returns:** Complete workflow object

### create_workflow
Creates a new workflow.
- **Parameters:**
  - `name` (string, required) — workflow name
  - `nodes` (array, optional) — nodes to include
  - `connections` (object, optional) — node connections
- **Returns:** Created workflow with ID

### update_workflow
Updates an existing workflow.
- **Parameters:**
  - `workflowId` (string, required)
  - `name` (string, optional)
  - `nodes` (array, optional)
  - `connections` (object, optional)
- **Returns:** Updated workflow

### delete_workflow
Permanently deletes a workflow.
- **Parameters:** `workflowId` (string, required)
- **Returns:** Confirmation message

### activate_workflow
Turns on a workflow so triggers fire.
- **Parameters:** `workflowId` (string, required)
- **Returns:** Confirmation with workflow name

### deactivate_workflow
Turns off a workflow.
- **Parameters:** `workflowId` (string, required)
- **Returns:** Confirmation with workflow name

## Node Operations

### search_nodes
Finds available n8n node types.
- **Parameters:** `query` (string, required) — search term
- **Returns:** Matching node types with descriptions

### add_node
Adds a node to a workflow.
- **Parameters:**
  - `workflowId` (string, required)
  - `nodeType` (string, required) — e.g., `n8n-nodes-base.slack`
  - `nodeName` (string, required) — display name
  - `position` ([number, number], required) — canvas position
  - `parameters` (object, optional) — node config
- **Returns:** Confirmation with node ID

### connect_nodes
Wires two nodes together.
- **Parameters:**
  - `workflowId` (string, required)
  - `sourceNodeName` (string, required)
  - `targetNodeName` (string, required)
  - `sourceOutput` (number, default 0)
  - `targetInput` (number, default 0)
- **Returns:** Confirmation

### configure_node
Updates node parameters.
- **Parameters:**
  - `workflowId` (string, required)
  - `nodeName` (string, required)
  - `parameters` (object, required)
- **Returns:** Confirmation with updated params

## Execution & Debugging

### execute_workflow
Runs a workflow and returns results.
- **Parameters:**
  - `workflowId` (string, required)
  - `inputData` (object, optional)
- **Returns:** Execution ID, status, errors if any

### list_executions
Lists recent executions.
- **Parameters:** `workflowId` (string, optional) — filter
- **Returns:** Array of execution summaries

### get_execution
Gets full execution details.
- **Parameters:** `executionId` (string, required)
- **Returns:** Complete execution data with per-node results

### debug_workflow
Analyzes a workflow for issues.
- **Parameters:** `workflowId` (string, required)
- **Returns:** Structural issues, recent errors, and fix suggestions

## Templates

### list_templates
Browse pre-built workflow templates.
- **Parameters:** `category` (string, optional) — filter
- **Returns:** Template summaries

### apply_template
Deploy a template as a new workflow.
- **Parameters:**
  - `templateId` (string, required)
  - `workflowName` (string, optional)
- **Returns:** Created workflow ID and activation instructions
