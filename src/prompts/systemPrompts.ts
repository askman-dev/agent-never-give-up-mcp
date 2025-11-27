// src/prompts/systemPrompts.ts

import type { ScenarioId } from "../types/scenarios";

/**
 * Build a system prompt for MCP sampling based on scenario.
 */
export function buildSamplingSystemPrompt(_params: {
	scenario: ScenarioId;
}): string {
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
}): string {
	const { scenario, templateSummary, contextSummary } = params;

	return [
		`Scenario id: ${scenario}`,
		"",
		"Scenario description / template summary:",
		templateSummary,
		"",
		"Context summary from the agent (reasoning, attempts, errors):",
		contextSummary,
	].join("\n");
}
