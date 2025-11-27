# Agent Never Give Up MCP

A **remote MCP (Model Context Protocol) server** hosted on Cloudflare Workers that provides **predefined and sampling-based "auto-prompts"** for stuck AI agents.

## Overview

This server exposes tools that help AI agents recover from common stuck situations, such as:

- **logic_is_too_complex** – when the agent is looping or over-complicating reasoning
- **bug_fix_always_failed** – when repeated attempts to fix a bug fail
- **analysis_too_long** – when the agent is spending too much time analyzing
- **missing_requirements** – when requirements are unclear or missing
- **unclear_acceptance_criteria** – when the agent doesn't know what "done" looks like

The server does not detect these situations itself – the host/agent decides when to call the tools. The server only:

1. Returns **static prompt templates** for a given scenario
2. Uses **MCP sampling** to generate **clarifying questions** (when the client supports it)

## Features

- **Remote MCP server** at `/mcp` endpoint (Streamable HTTP specification compliant)
- **Two-tier scenario organization**:
  - **Core scenarios** (auto-registered as direct MCP tools):
    - `logic_is_too_complex` – for circular reasoning or over-complicated logic
    - `bug_fix_always_failed` – for repeated failed bug fix attempts
    - `missing_requirements` – for unclear or missing requirements
  - **Extended scenarios** (discovered via `list_scenarios`, accessed via `get_prompt`):
    - `analysis_too_long` – for excessive analysis time
    - `unclear_acceptance_criteria` – for undefined acceptance criteria
- **Discovery tools**:
  - `list_scenarios` – list all scenarios with their tier (core/extended)
  - `get_prompt` – access any scenario (core or extended)
- **Dual mode support**: Each tool supports `static` and `sampling` modes
- **Community-contributed prompts** via markdown files
- **Public and auth-less** (v0)
- **Cloudflare Workers deployment**

## Configuration

Since `agent-never-give-up` is a cloud-hosted MCP server, no local installation is required. Simply add the server configuration to your preferred AI tool.

### Install in Cursor

1. Open **Cursor Settings** > **MCP**.
2. Click **+ Add new global MCP server**.
3. Use the following configuration (or edit your `~/.cursor/mcp.json` file directly):

```json
{
  "mcpServers": {
    "agent-never-give-up": {
      "type": "http",
      "url": "https://agent-never-give-up-mcp.askman.dev/mcp",
      "note": "A 'Swiss Army knife' toolset to help agents recover from getting stuck"
    }
  }
}
```

### Install in Claude Desktop

To configure the server for Claude Desktop, edit the configuration file located at:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following entry to the `mcpServers` object:

```json
{
  "mcpServers": {
    "agent-never-give-up": {
      "type": "http",
      "url": "https://agent-never-give-up-mcp.askman.dev/mcp"
    }
  }
}
```

### Install in Cline

1. Open **Cline** and click the **MCP Servers** icon (☰).
2. Select the **Remote Servers** tab (if available) or click **Configure MCP Servers**.
3. Edit the `cline_mcp_settings.json` file to include:

```json
{
  "mcpServers": {
    "agent-never-give-up": {
      "type": "http",
      "url": "https://agent-never-give-up-mcp.askman.dev/mcp",
      "note": "A comprehensive suite of tools designed to keep agents persistent and unstuck"
    }
  }
}
```

### Install in Windsurf

1. Open **Windsurf**.
2. Go to **File** > **Settings** > **Configure MCP Servers** (or edit `~/.codeium/windsurf/mcp_config.json`).
3. Add the server configuration:

```json
{
  "mcpServers": {
    "agent-never-give-up": {
      "type": "http",
      "url": "https://agent-never-give-up-mcp.askman.dev/mcp"
    }
  }
}
```

## Development

To contribute to this project or run a local instance:

```bash
# Install dependencies
npm install
```

The local server will be available at `http://localhost:8787/mcp`.

## Contributing Prompts

Prompts are organized in two tiers within the `prompts/` directory:

```
prompts/
├── core/                           # Core scenarios (auto-registered as tools)
│   ├── logic_is_too_complex/
│   │   └── tool.md
│   ├── bug_fix_always_failed/
│   │   └── tool.md
│   └── missing_requirements/
│       └── tool.md
└── extended/                       # Extended scenarios (via list_scenarios + get_prompt)
    ├── analysis_too_long/
    │   └── tool.md
    └── unclear_acceptance_criteria/
        └── tool.md
```

### Prompt File Format

Each `tool.md` file follows a simple markdown format with YAML frontmatter and a single protocol body:

```markdown
---
name: scenario_name
title: "Scenario Title"
description: "When / why the agent should call this tool, from the agent's perspective"
---

When you notice [the trigger condition], follow this exact protocol step by step.

## 1. First step title

1. Action item one.
2. Action item two.
3. Action item three.

Keep it concrete.

## 2. Second step title

...

## 3. Third step title

...
```

**Key principles:**
- The `description` explains *when* to use the tool (the trigger condition)
- The body is a *single protocol* with numbered sections
- Each section has 2–6 concrete steps
- Focus on *how to think*, not domain-specific details
- No system prompt / user prompt template sections—just one actionable protocol

See `prompts/AGENTS.md` for detailed guidance on writing effective prompts.

### Adding a New Scenario

**Core scenarios** (auto-registered as tools):
1. Create a new directory: `prompts/core/{scenario_name}/`
2. Add a `tool.md` file following the format above
3. Add the scenario ID to `src/types/scenarios.ts`
4. Import the markdown file in `src/prompts/scenarios.ts`
5. Add the scenario ID to `CORE_SCENARIO_IDS` in `src/prompts/scenarios.ts`

**Extended scenarios** (accessible via `get_prompt`):
1. Create a new directory: `prompts/extended/{scenario_name}/`
2. Add a `tool.md` file following the format above
3. Add the scenario ID to `src/types/scenarios.ts`
4. Import the markdown file in `src/prompts/scenarios.ts`

## Deploy

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

After deployment, your MCP endpoint will be:
`https://agent-never-give-up-mcp.<account>.workers.dev/mcp`

## License

MIT
