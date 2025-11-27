// src/mcpServer.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import {
	getAllScenarioIds,
	getFallbackQuestions,
	getTemplate,
	SCENARIO_TEMPLATES,
} from "./prompts/scenarios";
import {
	buildSamplingSystemPrompt,
	buildSamplingUserMessage,
} from "./prompts/systemPrompts";
import type {
	ClarifyingQuestion,
	ListScenariosResult,
	ScenarioId,
	ScenarioToolResult,
} from "./types/scenarios";

/**
 * Interface for MCP sampling message content.
 */
interface SamplingMessageContent {
	type: "text";
	text: string;
}

/**
 * Interface for MCP sampling result.
 */
interface SamplingResult {
	content?: SamplingMessageContent;
}

/**
 * Interface for server with potential sampling support.
 */
interface ServerWithSampling {
	sampling?: {
		createMessage: (params: unknown) => Promise<SamplingResult>;
	};
}

/**
 * Agent Never Give Up MCP - A remote MCP server that provides
 * predefined and sampling-based "auto-prompts" for stuck agents.
 */
export class AgentNeverGiveUpMCP extends McpAgent {
	server = new McpServer({
		name: "agent-never-give-up-mcp",
		version: "0.1.0",
	});

	async init() {
		// Optional helper tool: list_scenarios (for programmatic discovery)
		this.server.tool(
			"list_scenarios",
			"List available stuck-agent scenarios. This is a helper tool for programmatic discovery - all scenarios are also directly available as individual tools.",
			{},
			async () => {
				const result: ListScenariosResult = {
					scenarios: getAllScenarioIds().map((id) => {
						const template = SCENARIO_TEMPLATES[id];
						return {
							id,
							title: template.title,
							description: template.description,
						};
					}),
				};

				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			},
		);

		// Dynamically register a tool for each scenario
		for (const scenarioId of getAllScenarioIds()) {
			const template = getTemplate(scenarioId);
			if (!template) continue;

			this.server.tool(
				scenarioId, // Tool name is the scenario ID
				template.description, // Use scenario description as tool description
				{
					mode: z
						.enum(["static", "sampling"])
						.optional()
						.default("static")
						.describe(
							"Choose 'static' for predefined prompts or 'sampling' for AI-generated questions. Default is 'static' for MCP clients that don't support sampling.",
						),
					contextSummary: z
						.string()
						.optional()
						.describe(
							"Required for 'sampling' mode: A summary of what the agent has been trying to do and why it's stuck (200-800 chars recommended)",
						),
					maxQuestions: z
						.number()
						.int()
						.min(1)
						.max(10)
						.optional()
						.default(3)
						.describe(
							"For 'sampling' mode: Maximum number of questions to generate",
						),
				},
				async ({ mode, contextSummary, maxQuestions }) => {
					// Handle static mode (default)
					if (mode === "static") {
						const result: ScenarioToolResult = {
							mode: "static",
							template: template,
						};

						return {
							content: [
								{ type: "text", text: JSON.stringify(result, null, 2) },
							],
						};
					}

					// Handle sampling mode
					// Validate that contextSummary is provided for sampling mode
					if (!contextSummary) {
						return {
							content: [
								{
									type: "text",
									text: JSON.stringify({
										error:
											"contextSummary is required when using 'sampling' mode. Please provide a summary of what the agent has been trying to do and why it's stuck.",
									}),
								},
							],
							isError: true,
						};
					}

					const templateSummary = `${template.title}: ${template.description}`;

					// Try to use MCP sampling if available
					try {
						// Check if sampling is supported by casting to the extended interface
						const serverWithSampling = this
							.server as unknown as ServerWithSampling;
						if (
							serverWithSampling &&
							typeof serverWithSampling.sampling?.createMessage === "function"
						) {
							const samplingParams = {
								messages: [
									{
										role: "user" as const,
										content: {
											type: "text" as const,
											text: buildSamplingUserMessage({
												scenario: scenarioId,
												templateSummary,
												contextSummary,
												maxQuestions,
											}),
										},
									},
								],
								systemPrompt: buildSamplingSystemPrompt({
									scenario: scenarioId,
								}),
								maxTokens: 512,
								includeContext: "none" as const,
								modelPreferences: {
									hints: [{ name: "claude-3" }],
									speedPriority: 0.5,
									costPriority: 0.3,
									intelligencePriority: 0.8,
								},
							};

							const samplingResult =
								await serverWithSampling.sampling.createMessage(samplingParams);
							const rawText =
								samplingResult?.content?.type === "text"
									? samplingResult.content.text
									: "";

							const questions = parseQuestionsFromSamplingResponse(
								rawText,
								maxQuestions,
							);

							const result: ScenarioToolResult = {
								mode: "sampling",
								scenario: scenarioId,
								questions,
								rawSamplingResponse: rawText,
							};

							return {
								content: [
									{ type: "text", text: JSON.stringify(result, null, 2) },
								],
							};
						}
					} catch (error) {
						// Sampling not available or failed, fall through to fallback
						console.log(
							"Sampling not available or failed, using fallback:",
							error,
						);
					}

					// Fallback: generate static questions based on template
					const fallbackQuestions = generateFallbackQuestions(
						scenarioId,
						template,
						contextSummary,
					);

					const result: ScenarioToolResult = {
						mode: "sampling",
						scenario: scenarioId,
						questions: fallbackQuestions,
						rawSamplingResponse:
							"Sampling not available - using fallback questions",
					};

					return {
						content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
					};
				},
			);
		}
	}
}

/**
 * Parse questions from the sampling response.
 * Expected format: { "questions": [...] }
 */
function parseQuestionsFromSamplingResponse(
	rawText: string,
	maxQuestions: number,
): ClarifyingQuestion[] {
	if (!rawText) {
		return [];
	}

	try {
		// Try to extract JSON from the response
		const jsonMatch = rawText.match(/\{[\s\S]*"questions"[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]) as {
				questions?: Array<{
					id?: string;
					text?: string;
					type?: string;
					options?: Array<{ id: string; label: string }>;
				}>;
			};
			if (Array.isArray(parsed.questions)) {
				return parsed.questions.slice(0, maxQuestions).map((q, idx) => ({
					id: q.id || `q${idx + 1}`,
					text: q.text || String(q),
					type: (q.type as ClarifyingQuestion["type"]) || "free-text",
					options: q.options,
				}));
			}
		}
	} catch {
		// JSON parsing failed
	}

	// If parsing fails, treat the whole text as one question
	return [
		{
			id: "q1",
			text: rawText.trim(),
			type: "free-text",
		},
	];
}

/**
 * Generate fallback questions when sampling is not available.
 * Loads questions from the markdown tool definitions.
 */
function generateFallbackQuestions(
	scenario: ScenarioId,
	template: ReturnType<typeof getTemplate>,
	contextSummary: string,
): ClarifyingQuestion[] {
	// First try to get questions from markdown definitions
	const markdownQuestions = getFallbackQuestions(scenario);
	if (markdownQuestions.length > 0) {
		// Optionally incorporate contextSummary into the first question
		if (contextSummary && markdownQuestions.length > 0) {
			const firstQuestion = markdownQuestions[0];
			// Add context reference to make questions more specific
			markdownQuestions[0] = {
				...firstQuestion,
				text: `Given the context: "${contextSummary.slice(0, 100)}..." ${firstQuestion.text}`,
			};
		}
		return markdownQuestions;
	}

	// Fallback: If template has guidance bullets, use them to form questions
	if (template?.guidanceBullets && template.guidanceBullets.length > 0) {
		return template.guidanceBullets.slice(0, 3).map((bullet, idx) => ({
			id: `q${idx + 1}`,
			text: `Regarding "${bullet}", can you provide more details?`,
			type: "free-text" as const,
		}));
	}

	// Default fallback questions
	return [
		{
			id: "q1",
			text: "Can you describe this problem in more detail?",
			type: "free-text" as const,
		},
	];
}
