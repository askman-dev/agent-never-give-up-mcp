// src/index.ts

import { AgentNeverGiveUpMCP } from "./mcpServer";

// Export the MCP class for Cloudflare Durable Objects
export { AgentNeverGiveUpMCP };

/**
 * Validates the Origin header against the ALLOWED_ORIGINS environment variable.
 * @param request - The incoming request
 * @param env - The environment bindings
 * @returns A 403 Response if origin is invalid, or null if validation passes
 */
function validateOrigin(request: Request, env: Env): Response | null {
	const origin = request.headers.get("Origin");

	// If no Origin header is present (e.g., non-browser tools), allow the request
	if (!origin) {
		return null;
	}

	// If ALLOWED_ORIGINS is not configured, allow the request (permissive mode)
	if (!env.ALLOWED_ORIGINS) {
		return null;
	}

	// Parse the comma-separated list of allowed origins
	const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

	// Check if the origin is in the allowed list
	if (!allowedOrigins.includes(origin)) {
		return new Response("Forbidden: Origin not allowed", {
			status: 403,
			headers: { "content-type": "text/plain" },
		});
	}

	return null;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// MCP endpoint - single path for all MCP traffic (Streamable HTTP specification)
		if (url.pathname === "/mcp") {
			// Validate Origin header for security
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
