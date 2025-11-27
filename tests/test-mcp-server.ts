/**
 * Test case for MCP server using Claude Agent SDK
 * This test verifies that the MCP server properly exposes its tools
 *
 * Tests the LOCAL development server (starts wrangler dev automatically)
 * Uses HTTP protocol (MCP official recommendation) instead of SSE
 */

import { spawn, type ChildProcess } from "node:child_process";
import { ClaudeAgent } from "../src/agent/ClaudeAgent";

const LOCAL_MCP_SERVER_URL = "http://localhost:8787/mcp";
const SERVER_STARTUP_TIMEOUT = 30000; // 30 seconds to wait for server to start

let serverProcess: ChildProcess | null = null;

/**
 * Start the local wrangler dev server
 */
async function startLocalServer(): Promise<void> {
	console.log("🚀 Starting local wrangler dev server...");

	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("Server startup timed out"));
		}, SERVER_STARTUP_TIMEOUT);

		serverProcess = spawn("npx", ["wrangler", "dev", "--port", "8787"], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env },
		});

		let startupOutput = "";

		serverProcess.stdout?.on("data", (data: Buffer) => {
			const output = data.toString();
			startupOutput += output;
			console.log(`[wrangler] ${output.trim()}`);

			// Check if server is ready
			if (output.includes("Ready on") || output.includes("localhost:8787")) {
				clearTimeout(timeout);
				console.log("✅ Local server is ready");
				// Give it a bit more time to fully initialize
				setTimeout(resolve, 2000);
			}
		});

		serverProcess.stderr?.on("data", (data: Buffer) => {
			const output = data.toString();
			startupOutput += output;
			console.log(`[wrangler stderr] ${output.trim()}`);

			// Wrangler sometimes outputs ready message to stderr
			if (output.includes("Ready on") || output.includes("localhost:8787")) {
				clearTimeout(timeout);
				console.log("✅ Local server is ready");
				setTimeout(resolve, 2000);
			}
		});

		serverProcess.on("error", (error: Error) => {
			clearTimeout(timeout);
			reject(new Error(`Failed to start server: ${error.message}`));
		});

		serverProcess.on("exit", (code: number | null) => {
			if (code !== null && code !== 0) {
				clearTimeout(timeout);
				reject(
					new Error(
						`Server exited with code ${code}. Output: ${startupOutput}`,
					),
				);
			}
		});
	});
}

/**
 * Stop the local server
 */
function stopLocalServer(): void {
	if (serverProcess) {
		console.log("🛑 Stopping local server...");
		serverProcess.kill("SIGTERM");
		serverProcess = null;
	}
}

async function testListMcpTools(): Promise<void> {
	console.log("🚀 Starting MCP Server Tools Test (Local Dev Server)");
	console.log(`📡 MCP Server URL: ${LOCAL_MCP_SERVER_URL}`);
	console.log("");

	// Start the local development server
	await startLocalServer();

	// Create agent with MCP server configuration pointing to local server
	// Using HTTP protocol as recommended by MCP official documentation
	const agent = new ClaudeAgent({
		maxTurns: 5, // Limit turns for this simple test
		mcpServers: {
			"agent-never-give-up": {
				type: "http",
				url: LOCAL_MCP_SERVER_URL,
			},
		},
	});

	const systemPrompt =
		"You are a helpful assistant that can list and describe MCP tools available to you.";
	const userPrompt =
		"List my MCP server tools. Please list ALL the tools available from the MCP server and describe each one briefly.";

	console.log("📤 Sending prompt to agent...");
	console.log("");

	const result = await agent.run(systemPrompt, userPrompt);

	console.log("\n📋 Final Result:");
	console.log("=".repeat(60));
	console.log(result);
	console.log("=".repeat(60));

	// Verify that scenario-specific tools are mentioned in the output
	// The expected tools are: list_scenarios (helper) + 5 scenario-specific tools
	const expectedTools = [
		"list_scenarios",
		"logic_is_too_complex",
		"bug_fix_always_failed",
		"analysis_too_long",
		"missing_requirements",
		"unclear_acceptance_criteria",
	];

	let foundTools = 0;
	const missingTools: string[] = [];

	for (const tool of expectedTools) {
		if (result.toLowerCase().includes(tool.toLowerCase())) {
			console.log(`✅ Found tool: ${tool}`);
			foundTools++;
		} else {
			console.log(`❌ Missing tool: ${tool}`);
			missingTools.push(tool);
		}
	}

	console.log("");
	console.log("📊 Test Summary:");
	console.log(`   Found tools: ${foundTools}/${expectedTools.length}`);

	// Require at least 4 tools to be found (allowing some flexibility in AI response)
	const minRequiredTools = 4;
	if (foundTools >= minRequiredTools) {
		console.log(
			`✅ TEST PASSED: At least ${minRequiredTools} tools were found in the output`,
		);
		stopLocalServer();
		process.exit(0);
	} else {
		console.log(
			`❌ TEST FAILED: Expected at least ${minRequiredTools} tools, found ${foundTools}`,
		);
		console.log(`   Missing tools: ${missingTools.join(", ")}`);
		stopLocalServer();
		process.exit(1);
	}
}

// Run the test
testListMcpTools().catch((error: unknown) => {
	console.error("❌ Test failed with error:", error);
	stopLocalServer();
	process.exit(1);
});
