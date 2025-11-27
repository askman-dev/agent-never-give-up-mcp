// src/prompts/systemPrompts.ts

import type { ScenarioId } from "../types/scenarios";

/**
 * Build a system prompt for MCP sampling based on scenario and language.
 */
export function buildSamplingSystemPrompt(params: {
	scenario: ScenarioId;
	language: string;
}): string {
	const { language } = params;

	if (language === "zh-CN") {
		return [
			"你是一位专家助手，帮助人类和AI代理摆脱困境。",
			"你的任务是为人类用户（不是AI）提出少量高价值的澄清问题。",
			"这些问题应该是：",
			"- 针对场景的具体问题；",
			"- 有助于打破循环或重复失败；",
			"- 严格关注用户的目标和约束。",
			"",
			"严格按照以下JSON格式输出：",
			"{",
			'  "questions": [',
			"    {",
			'      "id": "q1",',
			'      "text": "...",',
			'      "type": "free-text" | "single-choice" | "multi-choice",',
			'      "options": [ { "id": "opt1", "label": "..." } ] // 可选，仅用于选择类型',
			"    }",
			"  ]",
			"}",
		].join("\n");
	}

	// Default: English
	return [
		"You are an expert assistant that helps a human and an AI agent get unstuck.",
		"Your task is to propose a small number of high-signal clarifying questions",
		"for the HUMAN user, not the AI. These questions should be:",
		"- concrete and specific to the scenario;",
		"- helpful to break loops or repeated failures;",
		"- strictly focused on the user's goal and constraints.",
		"",
		"Output STRICTLY in JSON with the following shape:",
		"{",
		'  "questions": [',
		"    {",
		'      "id": "q1",',
		'      "text": "...",',
		'      "type": "free-text" | "single-choice" | "multi-choice",',
		'      "options": [ { "id": "opt1", "label": "..." } ] // optional, only for choice types',
		"    }",
		"  ]",
		"}",
	].join("\n");
}

/**
 * Build a user message for MCP sampling.
 */
export function buildSamplingUserMessage(params: {
	scenario: ScenarioId;
	templateSummary: string;
	contextSummary: string;
	maxQuestions: number;
	language: string;
}): string {
	const { scenario, templateSummary, contextSummary, maxQuestions, language } =
		params;

	if (language === "zh-CN") {
		return [
			`场景ID: ${scenario}`,
			"",
			"场景描述/模板摘要：",
			templateSummary,
			"",
			"来自代理的上下文摘要（推理、尝试、错误）：",
			contextSummary,
			"",
			`请用请求的语言（${language}）生成最多${maxQuestions}个问题。`,
		].join("\n");
	}

	// Default: English
	return [
		`Scenario id: ${scenario}`,
		"",
		"Scenario description / template summary:",
		templateSummary,
		"",
		"Context summary from the agent (reasoning, attempts, errors):",
		contextSummary,
		"",
		`Please generate at most ${maxQuestions} questions in the requested language (${language}).`,
	].join("\n");
}
