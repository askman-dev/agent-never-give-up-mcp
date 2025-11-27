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
- **Three core tools**:
  - `list_scenarios` – discover available scenarios
  - `get_static_prompt` – get static prompt templates
  - `generate_clarifying_questions` – generate dynamic questions using MCP sampling
- **Multi-language support** (English and Chinese)
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

Prompts are stored in the `prompts/` directory with the structure:

```
prompts/
├── logic_is_too_complex/
│   └── tool.md
├── bug_fix_always_failed/
│   └── tool.md
├── analysis_too_long/
│   └── tool.md
├── missing_requirements/
│   └── tool.md
└── unclear_acceptance_criteria/
    └── tool.md
```

### Prompt File Format

Each `tool.md` file follows the GitHub Copilot Agent markdown format with YAML frontmatter:

```markdown
---
name: scenario_name
title:
  en: "English Title"
  zh-CN: "中文标题"
description:
  en: "English description"
  zh-CN: "中文描述"
---

## System Prompt

### English

Your system prompt in English...

### 中文

中文系统提示...

## User Prompt Template

### English

Your user prompt template with {{context}} placeholder...

### 中文

中文用户提示模板...

## Guidance Bullets

### English

- First bullet point
- Second bullet point

### 中文

- 第一个要点
- 第二个要点

## Fallback Questions

### English

- First fallback question?
- Second fallback question?

### 中文

- 第一个后备问题？
- 第二个后备问题？
```

### Adding a New Scenario

1. Create a new directory: `prompts/{scenario_name}/`
2. Add a `tool.md` file following the format above
3. Add the scenario ID to `src/types/scenarios.ts`
4. Import and register the markdown file in `src/prompts/scenarios.ts`

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
```bash
# In wrangler.toml or wrangler.jsonc
[vars]
ALLOWED_ORIGINS = "https://example.com,https://app.example.com"
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

### list_scenarios

List available stuck-agent scenarios and supported languages.

**Input**: None

**Output**:
```json
{
  "scenarios": [
    {
      "id": "logic_is_too_complex",
      "languages": ["en", "zh-CN"],
      "titleByLanguage": {...},
      "descriptionByLanguage": {...}
    }
  ]
}
```

### get_static_prompt

Return a static prompt template for a given scenario.

**Input**:
- `scenario` (required): One of the scenario IDs
- `language` (optional): BCP-47 language tag, defaults to "en"

**Output**:
```json
{
  "template": {
    "scenario": "logic_is_too_complex",
    "language": "en",
    "title": "Logic is too complex / circular",
    "description": "...",
    "systemPrompt": "...",
    "userPromptTemplate": "...",
    "guidanceBullets": [...]
  }
}
```

### generate_clarifying_questions

Generate clarifying questions using MCP sampling (with fallback to static questions).

**Input**:
- `scenario` (required): One of the scenario IDs
- `contextSummary` (required): Summary of what the agent has been trying to do
- `maxQuestions` (optional): Maximum questions to generate (1-10, default 3)
- `language` (optional): BCP-47 language tag, defaults to "en"

**Output**:
```json
{
  "scenario": "logic_is_too_complex",
  "language": "en",
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

## License

MIT
