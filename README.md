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

## Installation

```bash
npm install
```

## Development

```bash
# Start the development server
npm run dev

# Type check
npm run type-check

# Format code
npm run format

# Lint and fix
npm run lint:fix
```

The server will be available at `http://localhost:8787/mcp`.

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

Each `tool.md` file follows a simple markdown format with YAML frontmatter:

```markdown
---
name: scenario_name
title: "Scenario Title"
description: "When to use this scenario"
---

## System Prompt

Your system prompt content...

## User Prompt Template

Your user prompt template with {{context}} placeholder...

## Guidance Bullets

- First bullet point
- Second bullet point

## Fallback Questions

- First fallback question?
- Second fallback question?
```

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

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

After deployment, your MCP endpoint will be:
`https://agent-never-give-up-mcp.<account>.workers.dev/mcp`

## Environment Variables

### ALLOWED_ORIGINS

The `ALLOWED_ORIGINS` environment variable controls which origins are permitted to access the MCP server. This provides security for browser-based clients.

**Configuration:**
- Set as a comma-separated list of allowed origins
- If not set, the server operates in permissive mode (allows all origins)
- Requests without an `Origin` header (e.g., from non-browser tools like CLI clients) are always allowed

**Example:**
```jsonc
// In wrangler.jsonc
{
  // ... other config
  "vars": {
    "ALLOWED_ORIGINS": "https://example.com,https://app.example.com"
  }
}
```

**Behavior:**
- If `Origin` header is present and origin is in the allowed list: Request proceeds
- If `Origin` header is present and origin is NOT in the allowed list: Returns `403 Forbidden`
- If `Origin` header is missing: Request proceeds (allows non-browser tools)

## Client Configuration

### Claude Desktop (via mcp-remote)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-never-give-up": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://agent-never-give-up-mcp.<account>.workers.dev/mcp"
      ]
    }
  }
}
```

## API Endpoints

- `GET/POST /mcp` – MCP Streamable HTTP endpoint (handles all MCP traffic)
- `GET /health` – Health check

## Tools

The server exposes tools in two tiers:

### Core Scenario Tools (Auto-registered)

These scenarios are directly available as MCP tools:

#### logic_is_too_complex

Handle situations when the agent is stuck in circular reasoning or over-complicating logic.

#### bug_fix_always_failed

Handle situations when repeated attempts to fix a bug have failed.

#### missing_requirements

Handle situations when requirements are unclear or missing.

**Parameters** (same for all core scenario tools):
- `mode` (optional, default: `"static"`): Choose `"static"` for predefined prompts or `"sampling"` for AI-generated questions
- `contextSummary` (optional, required for `sampling` mode): A summary of what the agent has been trying to do and why it's stuck (200-800 chars recommended)
- `maxQuestions` (optional, default: `3`): For `sampling` mode, maximum number of questions to generate (1-10)

**Output (static mode)**:
```json
{
  "mode": "static",
  "template": {
    "scenario": "logic_is_too_complex",
    "title": "Logic is too complex / circular",
    "description": "...",
    "systemPrompt": "...",
    "userPromptTemplate": "...",
    "guidanceBullets": [...]
  }
}
```

**Output (sampling mode)**:
```json
{
  "mode": "sampling",
  "scenario": "logic_is_too_complex",
  "questions": [
    {
      "id": "q1",
      "text": "Can you describe your main goal in one sentence?",
      "type": "free-text"
    }
  ],
  "rawSamplingResponse": "..."
}
```

### Discovery and Access Tools

#### list_scenarios

List all available scenarios (core + extended) with their tier.

**Input**: None

**Output**:
```json
{
  "scenarios": [
    {
      "id": "logic_is_too_complex",
      "title": "Logic is too complex / circular",
      "description": "Use when the agent is stuck in circular reasoning...",
      "tier": "core"
    },
    {
      "id": "analysis_too_long",
      "title": "Analysis taking too long",
      "description": "Use when the agent is spending too much time analyzing...",
      "tier": "extended"
    }
  ]
}
```

#### get_prompt

Get prompt template for any scenario (core or extended). Use `list_scenarios` to discover available scenario IDs.

**Input**:
- `scenario` (required): Scenario ID from `list_scenarios`
- `mode` (optional, default: `"static"`): Choose `"static"` for predefined prompts or `"sampling"` for AI-generated questions
- `contextSummary` (optional, required for `sampling` mode): A summary of what the agent has been trying to do and why it's stuck
- `maxQuestions` (optional, default: `3`): For `sampling` mode, maximum number of questions to generate

**Output**: Same format as core scenario tools

## License

MIT
