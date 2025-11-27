// src/index.ts

import { AgentNeverGiveUpMCP } from "./mcpServer";

// Export the MCP class for Cloudflare Durable Objects
export { AgentNeverGiveUpMCP };

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// MCP over SSE endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return AgentNeverGiveUpMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// Alternative MCP endpoint
		if (url.pathname === "/mcp") {
			return AgentNeverGiveUpMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Health check endpoint
		if (url.pathname === "/health") {
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { "content-type": "application/json" },
			});
		}

		return new Response("Not found", { status: 404 });
	},
};
