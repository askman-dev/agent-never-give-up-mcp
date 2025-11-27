// src/prompts/scenarios.ts
// This file loads prompt templates from markdown files.
// Community contributions should add new prompts in the prompts/{tool_name}/tool.md format.

import type {
	ClarifyingQuestion,
	PromptTemplate,
	ScenarioId,
} from "../types/scenarios";
import {
	type ParsedToolDefinition,
	getFallbackQuestionsFromDefinition,
	parseToolMarkdown,
	toolDefinitionToTemplate,
} from "./loader";

// Import markdown files as raw strings
// In Cloudflare Workers, we need to embed these at build time
import logicTooComplexMd from "../../prompts/logic_is_too_complex/tool.md";
import bugFixFailedMd from "../../prompts/bug_fix_always_failed/tool.md";
import analysisTooLongMd from "../../prompts/analysis_too_long/tool.md";
import missingRequirementsMd from "../../prompts/missing_requirements/tool.md";
import unclearAcceptanceMd from "../../prompts/unclear_acceptance_criteria/tool.md";

/**
 * Raw markdown content for each scenario.
 */
const SCENARIO_MARKDOWN: Record<ScenarioId, string> = {
	logic_is_too_complex: logicTooComplexMd,
	bug_fix_always_failed: bugFixFailedMd,
	analysis_too_long: analysisTooLongMd,
	missing_requirements: missingRequirementsMd,
	unclear_acceptance_criteria: unclearAcceptanceMd,
};

/**
 * Parsed tool definitions cache.
 */
let parsedDefinitionsCache: Record<ScenarioId, ParsedToolDefinition> | null =
	null;

/**
 * Get parsed tool definitions (lazy loaded).
 */
function getParsedDefinitions(): Record<ScenarioId, ParsedToolDefinition> {
	if (!parsedDefinitionsCache) {
		parsedDefinitionsCache = {} as Record<ScenarioId, ParsedToolDefinition>;
		for (const [scenarioId, markdown] of Object.entries(SCENARIO_MARKDOWN)) {
			parsedDefinitionsCache[scenarioId as ScenarioId] =
				parseToolMarkdown(markdown);
		}
	}
	return parsedDefinitionsCache;
}

/**
 * Get all scenario templates from markdown files.
 */
function buildScenarioTemplates(): Record<ScenarioId, PromptTemplate> {
	const templates: Record<ScenarioId, PromptTemplate> = {} as Record<
		ScenarioId,
		PromptTemplate
	>;
	const definitions = getParsedDefinitions();

	for (const [scenarioId, def] of Object.entries(definitions)) {
		templates[scenarioId as ScenarioId] = toolDefinitionToTemplate(def);
	}

	return templates;
}

/**
 * Static scenario templates for each scenario ID.
 * Loaded from markdown files in prompts/{tool_name}/tool.md
 */
export const SCENARIO_TEMPLATES: Record<ScenarioId, PromptTemplate> =
	buildScenarioTemplates();

/**
 * Get all scenario IDs.
 */
export function getAllScenarioIds(): ScenarioId[] {
	return Object.keys(SCENARIO_TEMPLATES) as ScenarioId[];
}

/**
 * Get template for a specific scenario.
 */
export function getTemplate(scenarioId: ScenarioId): PromptTemplate | null {
	return SCENARIO_TEMPLATES[scenarioId] || null;
}

/**
 * Get fallback questions for a scenario.
 */
export function getFallbackQuestions(
	scenarioId: ScenarioId,
): ClarifyingQuestion[] {
	const definitions = getParsedDefinitions();
	const def = definitions[scenarioId];
	if (!def) {
		return [];
	}
	return getFallbackQuestionsFromDefinition(def);
}
