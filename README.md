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

- **Remote MCP server over SSE** at `/sse` endpoint
- **Three core tools**:
  - `list_scenarios` – discover available scenarios
  - `get_static_prompt` – get static prompt templates
  - `generate_clarifying_questions` – generate dynamic questions using MCP sampling
- **Multi-language support** (English and Chinese)
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

The server will be available at `http://localhost:8787/sse`.

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

After deployment, your MCP endpoint will be:
`https://agent-never-give-up-mcp.<account>.workers.dev/sse`

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
        "https://agent-never-give-up-mcp.<account>.workers.dev/sse"
      ]
    }
  }
}
```

## API Endpoints

- `GET /sse` – MCP over Server-Sent Events
- `POST /sse/message` – MCP message handler
- `GET /mcp` – Alternative MCP endpoint
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
