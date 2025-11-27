// src/types/scenarios.ts

import type { ScenarioId as GeneratedScenarioId } from "./generated-scenarios";

/**
 * Supported scenario IDs for stuck-agent situations.
 */
export type ScenarioId = GeneratedScenarioId;

/**
 * Scenario tier - determines how the scenario is exposed.
 * - "core": Auto-registered as direct MCP tools
 * - "extended": Discovered via list_scenarios, accessed via get_prompt
 */
export type ScenarioTier = "core" | "extended";

/**
 * A static prompt template for a given scenario.
 */
export interface PromptTemplate {
        scenario: ScenarioId;
        title: string; // short human-readable name
        description: string; // when to use this prompt
        promptBody: string; // full prompt content (markdown body)
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
 * Scenario metadata for listing.
 */
export interface ScenarioMetadata {
        id: ScenarioId;
        title: string;
        description: string;
        tier: ScenarioTier;
}

/**
 * Result of listing scenarios.
 */
export interface ListScenariosResult {
        scenarios: ScenarioMetadata[];
}

/**
 * Result of getting a static prompt.
 */
export interface GetStaticPromptResult {
        template: PromptTemplate;
}

/**
 * A message in the LLM completion array format.
 */
export interface PromptMessage {
        role: "user";
        content: string;
}

/**
 * Result of a scenario-specific tool for static mode.
 * Returns LLM completion array style: [{role: 'user', content: <prompt string>}]
 */
export type StaticToolResult = PromptMessage[];

/**
 * Result of a scenario-specific tool for sampling mode.
 * Returns sampling-based questions.
 */
export interface SamplingToolResult {
        scenario: ScenarioId;
        questions: ClarifyingQuestion[];
        rawSamplingResponse?: string;
}

/**
 * Result of a scenario-specific tool.
 * Returns either static prompt array or sampling-based questions based on the mode.
 * @deprecated Use StaticToolResult or SamplingToolResult instead
 */
export interface ScenarioToolResult {
        mode: "static" | "sampling";
        template?: PromptTemplate; // Present when mode is "static"
        scenario?: ScenarioId; // Present when mode is "sampling"
        questions?: ClarifyingQuestion[]; // Present when mode is "sampling"
        rawSamplingResponse?: string; // Present when mode is "sampling"
}
