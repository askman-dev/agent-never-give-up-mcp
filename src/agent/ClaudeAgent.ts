import { query } from "@anthropic-ai/claude-agent-sdk";
import dotenv from "dotenv";

dotenv.config();

export type McpStdioServerConfig = {
	type?: "stdio";
	command: string;
	args?: string[];
	env?: Record<string, string>;
};

export type McpSSEServerConfig = {
	type: "sse";
	url: string;
	headers?: Record<string, string>;
};

export type McpHttpServerConfig = {
	type: "http";
	url: string;
	headers?: Record<string, string>;
};

export type McpServerConfig =
	| McpStdioServerConfig
	| McpSSEServerConfig
	| McpHttpServerConfig;

export interface AgentConfig {
	model?: string;
	maxTurns?: number;
	cwd?: string;
	mcpServers?: Record<string, McpServerConfig>;
}

export class ClaudeAgent {
	private config: AgentConfig;

	constructor(config?: Partial<AgentConfig>) {
		this.config = {
			model:
				config?.model ||
				process.env.ANTHROPIC_MODEL ||
				"claude-3-5-sonnet-20241022",
			maxTurns: config?.maxTurns || 30,
			cwd: config?.cwd,
			mcpServers: config?.mcpServers,
		};
	}

	/**
	 * Run the agent with a prompt using the query() method
	 * External MCP tools will be used if configured
	 */
	async run(systemPrompt: string, userPrompt: string): Promise<string> {
		try {
			let finalResult = "";
			let messageCount = 0;

			console.log("🤖 Starting Claude Agent SDK query...");
			console.log(`📋 System Prompt: ${systemPrompt.substring(0, 100)}...`);
			console.log(`💬 User Prompt: ${userPrompt.substring(0, 100)}...`);
			console.log(`⚙️  Max Turns: ${this.config.maxTurns}`);
			console.log("");

			// Use the query() method from Agent SDK
			// External MCP servers configured below
			// Explicitly pass environment variables to ensure they're available in CI
			const authToken = process.env.ANTHROPIC_AUTH_TOKEN;
			const baseUrl = process.env.ANTHROPIC_BASE_URL;

			// Debug: Log environment variable status (without exposing the key)
			console.log("🔍 Environment check:");
			console.log(
				`   ANTHROPIC_AUTH_TOKEN: ${authToken ? `✅ Set (length: ${authToken.length})` : "❌ Not set"}`,
			);
			console.log(
				`   ANTHROPIC_BASE_URL: ${baseUrl ? `✅ Set (${baseUrl})` : "ℹ️  Not set (optional)"}`,
			);
			console.log("");

			if (!authToken) {
				throw new Error(
					"ANTHROPIC_AUTH_TOKEN environment variable is required",
				);
			}

			for await (const message of query({
				prompt: userPrompt,
				options: {
					systemPrompt,
					maxTurns: this.config.maxTurns,
					permissionMode: "bypassPermissions", // Skip permission prompts
					cwd: this.config.cwd || process.cwd(), // Set working directory
					// Explicitly pass environment variables to SDK
					env: {
						...process.env,
						ANTHROPIC_API_KEY: "", // Fixed to empty string
						ANTHROPIC_AUTH_TOKEN: authToken,
						...(baseUrl && { ANTHROPIC_BASE_URL: baseUrl }),
					},
					mcpServers: this.config.mcpServers,
				},
			})) {
				messageCount++;
				console.log(`\n[${messageCount}] 📨 Message type: ${message.type}`);

				// Handle different message types
				if (message.type === "assistant") {
					// Extract content from the nested message structure
					const messageObj = (message as { message?: { content?: unknown } })
						.message;
					const content = messageObj?.content;

					if (Array.isArray(content)) {
						for (const block of content) {
							if (block.type === "text") {
								finalResult += block.text;
								console.log(`    💭 Text: ${block.text}`);
							} else if (block.type === "tool_use") {
								console.log(
									`    🔧 Tool use: ${block.name}`,
									JSON.stringify(block.input, null, 2),
								);
							}
						}
					}
				} else if (message.type === "user") {
					console.log("    👤 User message");
				} else if (message.type === "result") {
					// Final result from the agent
					const resultMsg = message as {
						subtype?: string;
						duration_ms?: number;
						num_turns?: number;
						total_cost_usd?: number;
					};
					console.log(`\n${"=".repeat(60)}`);
					console.log("📊 Agent Execution Summary");
					console.log(`${"=".repeat(60)}`);
					console.log(`Status: ${message.subtype}`);
					console.log(`Total messages: ${messageCount}`);
					console.log(`Duration: ${resultMsg.duration_ms}ms`);
					console.log(`Turns used: ${resultMsg.num_turns || "N/A"}`);
					console.log(
						`Total cost: $${resultMsg.total_cost_usd?.toFixed(4) || "N/A"}`,
					);
					console.log(`Final result length: ${finalResult.length} characters`);

					if (message.subtype !== "success") {
						console.log(`\n⚠️  Warning: Agent finished with ${message.subtype}`);
						console.log("This may indicate the task was not fully completed.");
					}

					console.log(`${"=".repeat(60)}\n`);
					return finalResult;
				} else {
					console.log(`    ℹ️  Other message type: ${message.type}`);
				}
			}

			console.log("⚠️  Query loop ended without result message");
			return finalResult;
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			const errorStack = error instanceof Error ? error.stack : undefined;
			console.error("❌ Agent error:", errorMessage);
			console.error("Stack:", errorStack);
			throw error;
		}
	}
}
