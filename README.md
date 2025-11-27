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

- **Remote MCP server** using Streamable HTTP at `/mcp` endpoint
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

The server supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS/Origin validation. If not set or empty, all origins are allowed. | (empty - all origins allowed) |

### Example Configuration

In your `wrangler.jsonc` or environment settings:

```jsonc
{
  "vars": {
    "ALLOWED_ORIGINS": "https://example.com,https://app.example.com"
  }
}
```

When `ALLOWED_ORIGINS` is configured:
- Requests with an `Origin` header not in the allowed list will receive a `403 Forbidden` response
- Requests without an `Origin` header (e.g., server-to-server requests) are allowed
- If the variable is empty or not set, all origins are allowed

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

- `GET /mcp` – MCP over Streamable HTTP (SSE stream)
- `POST /mcp/message` – MCP message handler
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
