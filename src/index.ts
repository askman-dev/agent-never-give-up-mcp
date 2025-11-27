// src/index.ts

import { AgentNeverGiveUpMCP } from "./mcpServer";

// Export the MCP class for Cloudflare Durable Objects
export { AgentNeverGiveUpMCP };

/**
 * Validates the Origin header against the allowed origins list.
 * @param request The incoming request
 * @param env The environment variables
 * @returns A 403 response if the origin is not allowed, or null if allowed
 */
function validateOrigin(
	request: Request,
	env: Env & { ALLOWED_ORIGINS?: string },
): Response | null {
	const origin = request.headers.get("Origin");
	const allowedOriginsEnv = env.ALLOWED_ORIGINS;

	// If no ALLOWED_ORIGINS is configured or it's empty, allow all origins
	if (!allowedOriginsEnv || allowedOriginsEnv.trim() === "") {
		return null;
	}

	// If there's no Origin header, allow the request (non-browser clients)
	if (!origin) {
		return null;
	}

	// Parse the allowed origins (comma-separated list)
	const allowedOrigins = allowedOriginsEnv
		.split(",")
		.map((o) => o.trim())
		.filter((o) => o.length > 0);

	// If the list is empty after parsing, allow all origins
	if (allowedOrigins.length === 0) {
		return null;
	}

	// Check if the origin is in the allowed list
	if (!allowedOrigins.includes(origin)) {
		return new Response("Forbidden", { status: 403 });
	}

	return null;
}

export default {
	fetch(
		request: Request,
		env: Env & { ALLOWED_ORIGINS?: string },
		ctx: ExecutionContext,
	) {
		const url = new URL(request.url);

		// MCP endpoint - handles both GET (stream) and POST (message) requests
		if (url.pathname === "/mcp" || url.pathname === "/mcp/message") {
			// Validate Origin header
			const originError = validateOrigin(request, env);
			if (originError) {
				return originError;
			}

			return AgentNeverGiveUpMCP.serveSSE("/mcp").fetch(request, env, ctx);
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
