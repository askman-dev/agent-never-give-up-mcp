// src/mcpServer.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import {
	getAllScenarioIds,
	getCoreScenarioIds,
	isCoreScenario,
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
	PromptMessage,
	PromptTemplate,
	SamplingToolResult,
	ScenarioId,
	StaticToolResult,
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
 * Maximum length of context summary to show in fallback question preview.
 */
const CONTEXT_PREVIEW_LENGTH = 100;

/**
 * All valid scenario IDs for validation in get_prompt tool.
 */
const SCENARIO_IDS: [ScenarioId, ...ScenarioId[]] = [
	"logic_is_too_complex",
	"bug_fix_always_failed",
	"analysis_too_long",
	"missing_requirements",
	"unclear_acceptance_criteria",
];

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
		// 1. list_scenarios - Discovery tool that lists all scenarios with their tier
		this.server.tool(
			"list_scenarios",
			"List all available stuck-agent scenarios with their tier (core/extended). Core scenarios are also directly available as individual tools.",
			{},
			async () => {
				const result: ListScenariosResult = {
					scenarios: getAllScenarioIds().map((id) => {
						const template = SCENARIO_TEMPLATES[id];
						return {
							id,
							title: template.title,
							description: template.description,
							tier: isCoreScenario(id) ? "core" : "extended",
						};
					}),
				};

				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			},
		);

		// 2. Dynamically register tools for CORE scenarios only
		for (const scenarioId of getCoreScenarioIds()) {
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
				},
				async ({ mode, contextSummary }) => {
					return handleScenarioRequest(
						this.server,
						scenarioId,
						template,
						mode,
						contextSummary,
					);
				},
			);
		}

		// 3. get_prompt - Generic tool for accessing any scenario (core or extended)
		this.server.tool(
			"get_prompt",
			"Get prompt template for any scenario (core or extended) with optional mode. Use list_scenarios to discover available scenario IDs.",
			{
				scenario: z
					.enum(SCENARIO_IDS)
					.describe("The scenario ID to get the prompt for"),
				mode: z
					.enum(["static", "sampling"])
					.optional()
					.default("static")
					.describe(
						"Choose 'static' for predefined prompts or 'sampling' for AI-generated questions.",
					),
				contextSummary: z
					.string()
					.optional()
					.describe(
						"Required for 'sampling' mode: A summary of what the agent has been trying to do and why it's stuck",
					),
			},
			async ({ scenario, mode, contextSummary }) => {
				const template = getTemplate(scenario);
				if (!template) {
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({
									error: `No template found for scenario: ${scenario}`,
								}),
							},
						],
						isError: true,
					};
				}

				return handleScenarioRequest(
					this.server,
					scenario,
					template,
					mode,
					contextSummary,
				);
			},
		);
	}
}

/**
 * Shared handler for scenario requests (used by both core tools and get_prompt).
 */
async function handleScenarioRequest(
	server: McpServer,
	scenarioId: ScenarioId,
	template: PromptTemplate,
	mode: "static" | "sampling",
	contextSummary: string | undefined,
): Promise<{
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}> {
	// Handle static mode (default)
	if (mode === "static") {
		// Return messages array format: [{role: 'user', content: <prompt string>}]
		const result: StaticToolResult = [
			{
				role: "user",
				content: template.promptBody,
			},
		];

		return {
			content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
		const serverWithSampling = server as unknown as ServerWithSampling;
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

			const questions = parseQuestionsFromSamplingResponse(rawText);

			const result: SamplingToolResult = {
				scenario: scenarioId,
				questions,
				rawSamplingResponse: rawText,
			};

			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}
	} catch (error) {
		// Sampling not available or failed, fall through to fallback
		console.log("Sampling not available or failed, using fallback:", error);
	}

	// Fallback: generate static questions based on template
	const fallbackQuestions = generateFallbackQuestions(
		scenarioId,
		template,
		contextSummary,
	);

	const result: SamplingToolResult = {
		scenario: scenarioId,
		questions: fallbackQuestions,
		rawSamplingResponse: "Sampling not available - using fallback questions",
	};

	return {
		content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
	};
}

/**
 * Parse questions from the sampling response.
 * Expected format: { "questions": [...] }
 */
function parseQuestionsFromSamplingResponse(
	rawText: string,
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
				return parsed.questions.map((q, idx) => ({
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
				text: `Given the context: "${contextSummary.slice(0, CONTEXT_PREVIEW_LENGTH)}..." ${firstQuestion.text}`,
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
