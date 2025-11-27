/**
 * Test case for MCP server using Claude Agent SDK
 * This test verifies that the MCP server properly exposes its tools
 */

import { ClaudeAgent } from "../src/agent/ClaudeAgent";

const MCP_SERVER_URL =
	process.env.MCP_SERVER_URL ||
	"https://agent-never-give-up-mcp.mcp-testing.workers.dev/sse";

async function testListMcpTools(): Promise<void> {
	console.log("🚀 Starting MCP Server Tools Test");
	console.log(`📡 MCP Server URL: ${MCP_SERVER_URL}`);
	console.log("");

	// Create agent with MCP server configuration
	const agent = new ClaudeAgent({
		maxTurns: 5, // Limit turns for this simple test
		mcpServers: {
			"agent-never-give-up": {
				type: "sse",
				url: MCP_SERVER_URL,
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

	// Verify that at least 3 tools are mentioned in the output
	// The expected tools are: list_scenarios, get_static_prompt, generate_clarifying_questions
	const expectedTools = [
		"list_scenarios",
		"get_static_prompt",
		"generate_clarifying_questions",
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

	if (foundTools >= expectedTools.length) {
		console.log(
			`✅ TEST PASSED: At least ${expectedTools.length} tools were found in the output`,
		);
		process.exit(0);
	} else {
		console.log(
			`❌ TEST FAILED: Expected at least ${expectedTools.length} tools, found ${foundTools}`,
		);
		console.log(`   Missing tools: ${missingTools.join(", ")}`);
		process.exit(1);
	}
}

// Run the test
testListMcpTools().catch((error: unknown) => {
	console.error("❌ Test failed with error:", error);
	process.exit(1);
});
