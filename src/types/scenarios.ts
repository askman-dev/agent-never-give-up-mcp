// src/types/scenarios.ts

/**
 * Supported scenario IDs for stuck-agent situations.
 */
export type ScenarioId =
	| "logic_is_too_complex"
	| "bug_fix_always_failed"
	| "analysis_too_long"
	| "missing_requirements"
	| "unclear_acceptance_criteria";

/**
 * A static prompt template for a given scenario.
 */
export interface PromptTemplate {
	scenario: ScenarioId;
	title: string; // short human-readable name
	description: string; // when to use this prompt
	systemPrompt: string; // recommended system-level guidance
	userPromptTemplate?: string; // optional user message template with placeholders
	guidanceBullets?: string[]; // bullet points shown to user/agent
}

/**
 * Type of clarifying question.
 */
export type QuestionType = "free-text" | "single-choice" | "multi-choice";

/**
 * An option for choice-type questions.
 */
export interface ClarifyingQuestionOption {
	id: string;
	label: string;
}

/**
 * A clarifying question generated for a stuck agent.
 */
export interface ClarifyingQuestion {
	id: string; // stable per question
	text: string;
	type: QuestionType;
	options?: ClarifyingQuestionOption[];
}

/**
 * Result of generating clarifying questions.
 */
export interface ClarifyingQuestionsResult {
	scenario: ScenarioId;
	questions: ClarifyingQuestion[];
	rawSamplingResponse?: string; // original text from sampling result for debugging (optional)
}

/**
 * Result of listing scenarios.
 */
export interface ListScenariosResult {
	scenarios: {
		id: ScenarioId;
		title: string;
		description: string;
	}[];
}

/**
 * Result of getting a static prompt.
 */
export interface GetStaticPromptResult {
	template: PromptTemplate;
}
