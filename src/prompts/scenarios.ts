// src/prompts/scenarios.ts
// This file loads prompt templates from markdown files.
// Community contributions should add new prompts in the prompts/{core|extended}/{tool_name}/tool.md format.

import type {
        ClarifyingQuestion,
        PromptTemplate,
        ScenarioId,
} from "../types/scenarios";
import { DISCOVERED_SCENARIOS } from "./generated-scenarios";
import {
        type ParsedToolDefinition,
        getFallbackQuestionsFromDefinition,
        parseToolMarkdown,
        toolDefinitionToTemplate,
} from "./loader";

/**
 * Raw markdown content for each scenario.
 */
const SCENARIO_MARKDOWN: Record<ScenarioId, string> = Object.fromEntries(
        DISCOVERED_SCENARIOS.map((scenario) => [scenario.id, scenario.markdown]),
) as Record<ScenarioId, string>;

/**
 * Core scenario IDs that are exposed as direct MCP tools.
 */
const CORE_SCENARIO_IDS: ScenarioId[] = DISCOVERED_SCENARIOS.filter(
        (scenario) => scenario.tier === "core",
).map((scenario) => scenario.id);

/**
 * Get core scenario IDs (auto-registered as tools).
 */
export function getCoreScenarioIds(): ScenarioId[] {
	return CORE_SCENARIO_IDS;
}

/**
 * Check if a scenario is a core scenario.
 */
export function isCoreScenario(scenarioId: ScenarioId): boolean {
	return CORE_SCENARIO_IDS.includes(scenarioId);
}

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
                        const parsed = parseToolMarkdown(markdown);
                        parsedDefinitionsCache[scenarioId as ScenarioId] = {
                                ...parsed,
                                name: scenarioId,
                        };
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
                templates[scenarioId as ScenarioId] = toolDefinitionToTemplate(
                        def,
                        scenarioId as ScenarioId,
                );
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
