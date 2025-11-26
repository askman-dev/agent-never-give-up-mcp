// src/prompts/scenarios.ts

import type { PromptTemplate, ScenarioId } from "../types/scenarios";

/**
 * Supported languages for prompts.
 */
export const SUPPORTED_LANGUAGES = ["en", "zh-CN"] as const;

/**
 * Static scenario templates for each scenario ID.
 */
export const SCENARIO_TEMPLATES: Record<ScenarioId, PromptTemplate[]> = {
	logic_is_too_complex: [
		{
			scenario: "logic_is_too_complex",
			language: "en",
			title: "Logic is too complex / circular",
			description:
				"Use when the agent is stuck in circular reasoning or overly complex chains of thought.",
			systemPrompt:
				"You are a senior engineer helping simplify an over-complicated reasoning process. " +
				"Your job is to: (1) restate the goal in one sentence, (2) identify at most three key " +
				"sub-problems, and (3) propose a simpler plan of attack.",
			userPromptTemplate:
				"The model seems stuck in complex or circular reasoning trying to solve this problem:\n\n{{context}}\n\n" +
				"Help simplify and reframe the approach.",
			guidanceBullets: [
				"Prefer small, testable steps over big refactors",
				"Call out missing information explicitly",
				"Suggest checkpoints where the agent should validate intermediate results",
			],
		},
		{
			scenario: "logic_is_too_complex",
			language: "zh-CN",
			title: "逻辑过于复杂/循环",
			description: "当代理陷入循环推理或过于复杂的思维链时使用。",
			systemPrompt:
				"你是一位资深工程师，正在帮助简化过于复杂的推理过程。" +
				"你的任务是：(1) 用一句话重述目标，(2) 识别最多三个关键子问题，(3) 提出一个更简单的解决方案。",
			userPromptTemplate:
				"模型似乎在尝试解决这个问题时陷入了复杂或循环的推理：\n\n{{context}}\n\n" +
				"请帮助简化并重新构建方法。",
			guidanceBullets: [
				"优先选择小型、可测试的步骤，而不是大规模重构",
				"明确指出缺失的信息",
				"建议代理应验证中间结果的检查点",
			],
		},
	],
	bug_fix_always_failed: [
		{
			scenario: "bug_fix_always_failed",
			language: "en",
			title: "Bug fix keeps failing",
			description:
				"Use when repeated attempts to fix a bug have failed, and the agent is stuck in a loop.",
			systemPrompt:
				"You are a debugging expert helping break out of a bug-fix loop. " +
				"Your job is to: (1) identify what has been tried, (2) highlight what hasn't been tested, " +
				"(3) suggest a different debugging strategy or ask clarifying questions about the root cause.",
			userPromptTemplate:
				"The agent has tried multiple times to fix this bug but keeps failing:\n\n{{context}}\n\n" +
				"Help identify what might be missing and suggest a new approach.",
			guidanceBullets: [
				"List all attempted fixes and their outcomes",
				"Consider if the bug is a symptom of a deeper issue",
				"Suggest adding more logging or debugging output",
				"Consider if the test itself is correct",
			],
		},
		{
			scenario: "bug_fix_always_failed",
			language: "zh-CN",
			title: "Bug修复总是失败",
			description: "当多次尝试修复bug失败，代理陷入循环时使用。",
			systemPrompt:
				"你是一位调试专家，正在帮助打破bug修复的循环。" +
				"你的任务是：(1) 识别已经尝试过的方法，(2) 突出未测试的内容，" +
				"(3) 建议不同的调试策略或询问关于根本原因的澄清问题。",
			userPromptTemplate:
				"代理已经多次尝试修复这个bug，但一直失败：\n\n{{context}}\n\n" +
				"请帮助识别可能遗漏的内容并建议新的方法。",
			guidanceBullets: [
				"列出所有尝试过的修复及其结果",
				"考虑bug是否是更深层问题的症状",
				"建议添加更多日志或调试输出",
				"考虑测试本身是否正确",
			],
		},
	],
	analysis_too_long: [
		{
			scenario: "analysis_too_long",
			language: "en",
			title: "Analysis taking too long",
			description:
				"Use when the agent is spending too much time analyzing without making progress.",
			systemPrompt:
				"You are a productivity coach helping an agent that is over-analyzing. " +
				"Your job is to: (1) identify what is actually needed to move forward, " +
				"(2) suggest time-boxing the analysis, (3) recommend making a decision with incomplete information.",
			userPromptTemplate:
				"The agent has been analyzing this problem for too long without progress:\n\n{{context}}\n\n" +
				"Help suggest a way to move forward.",
			guidanceBullets: [
				"Set a clear deadline for the analysis phase",
				"Identify the minimum viable information needed",
				"Suggest making a reversible decision to unblock progress",
				"Consider if perfectionism is blocking action",
			],
		},
		{
			scenario: "analysis_too_long",
			language: "zh-CN",
			title: "分析时间过长",
			description: "当代理花费过多时间分析而没有进展时使用。",
			systemPrompt:
				"你是一位生产力教练，正在帮助一个过度分析的代理。" +
				"你的任务是：(1) 识别实际需要什么才能向前推进，" +
				"(2) 建议为分析设定时间限制，(3) 建议在信息不完整的情况下做出决定。",
			userPromptTemplate:
				"代理在分析这个问题上花费了太长时间，没有进展：\n\n{{context}}\n\n" +
				"请帮助建议一种向前推进的方法。",
			guidanceBullets: [
				"为分析阶段设定明确的截止日期",
				"识别所需的最少可行信息",
				"建议做出可逆的决定以解除进展阻碍",
				"考虑是否完美主义阻碍了行动",
			],
		},
	],
	missing_requirements: [
		{
			scenario: "missing_requirements",
			language: "en",
			title: "Missing requirements",
			description:
				"Use when the agent cannot proceed due to missing or unclear requirements.",
			systemPrompt:
				"You are a requirements analyst helping identify gaps. " +
				"Your job is to: (1) list what is known, (2) identify what is missing, " +
				"(3) suggest clarifying questions to ask the user.",
			userPromptTemplate:
				"The agent cannot proceed because requirements are missing or unclear:\n\n{{context}}\n\n" +
				"Help identify what information is needed.",
			guidanceBullets: [
				"List all known requirements clearly",
				"Identify specific gaps that block progress",
				"Prioritize the most critical missing information",
				"Suggest reasonable defaults where possible",
			],
		},
		{
			scenario: "missing_requirements",
			language: "zh-CN",
			title: "缺少需求",
			description: "当代理因需求缺失或不清晰而无法继续时使用。",
			systemPrompt:
				"你是一位需求分析师，正在帮助识别空白。" +
				"你的任务是：(1) 列出已知的内容，(2) 识别缺失的内容，" +
				"(3) 建议向用户提出的澄清问题。",
			userPromptTemplate:
				"代理无法继续，因为需求缺失或不清晰：\n\n{{context}}\n\n" +
				"请帮助识别需要什么信息。",
			guidanceBullets: [
				"清楚地列出所有已知需求",
				"识别阻碍进展的具体空白",
				"优先考虑最关键的缺失信息",
				"在可能的情况下建议合理的默认值",
			],
		},
	],
	unclear_acceptance_criteria: [
		{
			scenario: "unclear_acceptance_criteria",
			language: "en",
			title: "Unclear acceptance criteria",
			description:
				"Use when the agent doesn't know what 'done' looks like for the task.",
			systemPrompt:
				"You are a quality assurance expert helping define done. " +
				"Your job is to: (1) understand what the user considers success, " +
				"(2) suggest concrete acceptance criteria, (3) identify edge cases to consider.",
			userPromptTemplate:
				"The agent is unclear about what constitutes success for this task:\n\n{{context}}\n\n" +
				"Help define clear acceptance criteria.",
			guidanceBullets: [
				"Define what success looks like in concrete terms",
				"List specific test cases that should pass",
				"Identify edge cases and error conditions",
				"Suggest metrics or validation methods",
			],
		},
		{
			scenario: "unclear_acceptance_criteria",
			language: "zh-CN",
			title: "验收标准不明确",
			description: "当代理不知道任务的「完成」是什么样子时使用。",
			systemPrompt:
				"你是一位质量保证专家，正在帮助定义完成标准。" +
				"你的任务是：(1) 了解用户认为的成功是什么，" +
				"(2) 建议具体的验收标准，(3) 识别需要考虑的边缘情况。",
			userPromptTemplate:
				"代理不清楚这个任务的成功是什么：\n\n{{context}}\n\n" +
				"请帮助定义明确的验收标准。",
			guidanceBullets: [
				"用具体的术语定义成功是什么样子",
				"列出应该通过的具体测试用例",
				"识别边缘情况和错误条件",
				"建议指标或验证方法",
			],
		},
	],
};

/**
 * Get all scenario IDs.
 */
export function getAllScenarioIds(): ScenarioId[] {
	return Object.keys(SCENARIO_TEMPLATES) as ScenarioId[];
}

/**
 * Get templates for a specific scenario.
 */
export function getTemplatesForScenario(
	scenarioId: ScenarioId,
): PromptTemplate[] {
	return SCENARIO_TEMPLATES[scenarioId] || [];
}

/**
 * Get a template for a specific scenario and language, with fallback to English.
 */
export function getTemplate(
	scenarioId: ScenarioId,
	language: string,
): PromptTemplate | null {
	const templates = getTemplatesForScenario(scenarioId);
	if (templates.length === 0) {
		return null;
	}

	// Try to find exact language match
	const exactMatch = templates.find((t) => t.language === language);
	if (exactMatch) {
		return exactMatch;
	}

	// Fallback to English
	const englishFallback = templates.find((t) => t.language === "en");
	if (englishFallback) {
		return englishFallback;
	}

	// Return first available
	return templates[0];
}
