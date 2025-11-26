// src/mcpServer.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import {
	getAllScenarioIds,
	getTemplate,
	SCENARIO_TEMPLATES,
} from "./prompts/scenarios";
import {
	buildSamplingSystemPrompt,
	buildSamplingUserMessage,
} from "./prompts/systemPrompts";
import type {
	ClarifyingQuestion,
	ClarifyingQuestionsResult,
	GetStaticPromptResult,
	ListScenariosResult,
	ScenarioId,
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
 * All valid scenario IDs for validation.
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
		// Tool 1: list_scenarios
		this.server.tool(
			"list_scenarios",
			"List available stuck-agent scenarios and supported languages.",
			{},
			async () => {
				const result: ListScenariosResult = {
					scenarios: getAllScenarioIds().map((id) => {
						const templates = SCENARIO_TEMPLATES[id];
						const languages = templates.map((t) => t.language);
						const titleByLanguage: Record<string, string> = {};
						const descriptionByLanguage: Record<string, string> = {};

						for (const template of templates) {
							titleByLanguage[template.language] = template.title;
							descriptionByLanguage[template.language] = template.description;
						}

						return {
							id,
							languages,
							titleByLanguage,
							descriptionByLanguage,
						};
					}),
				};

				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			},
		);

		// Tool 2: get_static_prompt
		this.server.tool(
			"get_static_prompt",
			"Return a static prompt template for a given scenario.",
			{
				scenario: z
					.enum(SCENARIO_IDS)
					.describe("The scenario ID to get the prompt for"),
				language: z
					.string()
					.optional()
					.default("en")
					.describe("BCP-47 language tag, defaults to 'en'."),
			},
			async ({ scenario, language }) => {
				const template = getTemplate(scenario, language);

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

				const result: GetStaticPromptResult = { template };

				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			},
		);

		// Tool 3: generate_clarifying_questions (sampling-based)
		this.server.tool(
			"generate_clarifying_questions",
			"Use MCP sampling to generate clarifying questions for a stuck agent based on the provided scenario and context summary.",
			{
				scenario: z.enum(SCENARIO_IDS).describe("The scenario ID for context"),
				contextSummary: z
					.string()
					.describe(
						"Short summary (~200-800 chars) of what the agent has been trying to do, error messages, and why it seems stuck.",
					),
				maxQuestions: z
					.number()
					.int()
					.min(1)
					.max(10)
					.optional()
					.default(3)
					.describe("Maximum number of questions to generate"),
				language: z
					.string()
					.optional()
					.default("en")
					.describe("BCP-47 language tag for the questions, defaults to 'en'."),
			},
			async ({ scenario, contextSummary, maxQuestions, language }) => {
				const template = getTemplate(scenario, language);
				const templateSummary = template
					? `${template.title}: ${template.description}`
					: `Scenario: ${scenario}`;

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
											scenario,
											templateSummary,
											contextSummary,
											maxQuestions,
											language,
										}),
									},
								},
							],
							systemPrompt: buildSamplingSystemPrompt({ scenario, language }),
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

						const result: ClarifyingQuestionsResult = {
							scenario,
							language,
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
					scenario,
					template,
					contextSummary,
					language,
				);

				const result: ClarifyingQuestionsResult = {
					scenario,
					language,
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
 */
function generateFallbackQuestions(
	scenario: ScenarioId,
	template: ReturnType<typeof getTemplate>,
	_contextSummary: string,
	language: string,
): ClarifyingQuestion[] {
	const isZhCN = language === "zh-CN";

	// Generic fallback questions based on scenario
	const fallbacksByScenario: Record<ScenarioId, ClarifyingQuestion[]> = {
		logic_is_too_complex: [
			{
				id: "q1",
				text: isZhCN
					? "你能用一句话描述你的主要目标是什么吗？"
					: "Can you describe your main goal in one sentence?",
				type: "free-text",
			},
			{
				id: "q2",
				text: isZhCN
					? "有哪些约束或限制我们必须遵守？"
					: "What constraints or limitations must we work within?",
				type: "free-text",
			},
		],
		bug_fix_always_failed: [
			{
				id: "q1",
				text: isZhCN
					? "你能提供确切的错误消息或失败输出吗？"
					: "Can you provide the exact error message or failure output?",
				type: "free-text",
			},
			{
				id: "q2",
				text: isZhCN
					? "这段代码以前工作过吗？如果是，最近有什么变化？"
					: "Did this code work before? If so, what changed recently?",
				type: "free-text",
			},
		],
		analysis_too_long: [
			{
				id: "q1",
				text: isZhCN
					? "做出决定所需的最少信息是什么？"
					: "What is the minimum information needed to make a decision?",
				type: "free-text",
			},
			{
				id: "q2",
				text: isZhCN
					? "我们是否可以做一个可逆的决定来继续前进？"
					: "Can we make a reversible decision to move forward?",
				type: "free-text",
			},
		],
		missing_requirements: [
			{
				id: "q1",
				text: isZhCN
					? "你能列出目前已知的所有需求吗？"
					: "Can you list all the requirements that are currently known?",
				type: "free-text",
			},
			{
				id: "q2",
				text: isZhCN
					? "谁是这个功能的主要利益相关者？"
					: "Who are the main stakeholders for this feature?",
				type: "free-text",
			},
		],
		unclear_acceptance_criteria: [
			{
				id: "q1",
				text: isZhCN
					? "用户如何知道这个功能是否正常工作？"
					: "How will the user know if this feature is working correctly?",
				type: "free-text",
			},
			{
				id: "q2",
				text: isZhCN
					? "有哪些边缘情况我们应该考虑？"
					: "What edge cases should we consider?",
				type: "free-text",
			},
		],
	};

	// If template has guidance bullets, use them to form questions
	if (template?.guidanceBullets && template.guidanceBullets.length > 0) {
		return template.guidanceBullets.slice(0, 3).map((bullet, idx) => ({
			id: `q${idx + 1}`,
			text: isZhCN
				? `关于"${bullet}"，你能提供更多信息吗？`
				: `Regarding "${bullet}", can you provide more details?`,
			type: "free-text" as const,
		}));
	}

	return fallbacksByScenario[scenario] || [];
}
