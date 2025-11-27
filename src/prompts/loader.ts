// src/prompts/loader.ts

import type {
	PromptTemplate,
	ScenarioId,
	ClarifyingQuestion,
} from "../types/scenarios";

/**
 * Parsed tool definition from markdown file.
 */
export interface ParsedToolDefinition {
	name: string;
	title: string;
	description: string;
	systemPrompt: string;
	userPromptTemplate: string;
	guidanceBullets: string[];
	fallbackQuestions: string[];
}

/**
 * Parse YAML frontmatter from markdown content.
 */
function parseFrontmatter(content: string): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, body: content };
	}

	const yamlContent = match[1];
	const body = match[2];

	// Simple YAML parser for our specific format
	const frontmatter: Record<string, unknown> = {};

	const lines = yamlContent.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		// Skip empty lines
		if (!trimmedLine) continue;

		// Check for key-value pair
		const keyValueMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
		if (keyValueMatch) {
			const key = keyValueMatch[1];
			let value = keyValueMatch[2].trim();
			// Remove quotes if present
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1);
			} else if (value.startsWith("'") && value.endsWith("'")) {
				value = value.slice(1, -1);
			}
			frontmatter[key] = value;
		}
	}

	return { frontmatter, body };
}

/**
 * Extract content sections from markdown body.
 */
function extractSections(body: string): Record<string, string | string[]> {
	const sections: Record<string, string | string[]> = {};
	const lines = body.split("\n");

	let currentSection = "";
	let currentContent: string[] = [];

	const saveCurrentContent = () => {
		if (currentSection && currentContent.length > 0) {
			const content = currentContent.join("\n").trim();

			// Check if content is a list
			if (content.startsWith("- ")) {
				sections[currentSection] = content
					.split("\n")
					.filter((line) => line.startsWith("- "))
					.map((line) => line.slice(2).trim());
			} else {
				sections[currentSection] = content;
			}
		}
		currentContent = [];
	};

	for (const line of lines) {
		// Check for H2 section header
		const h2Match = line.match(/^## (.+)$/);
		if (h2Match) {
			saveCurrentContent();
			currentSection = h2Match[1].toLowerCase().replace(/\s+/g, "_");
			continue;
		}

		// Collect content (skip H3 headers as we no longer have language variants)
		if (currentSection && !line.startsWith("### ")) {
			currentContent.push(line);
		}
	}

	// Save last section
	saveCurrentContent();

	return sections;
}

/**
 * Parse a single tool markdown file.
 */
export function parseToolMarkdown(content: string): ParsedToolDefinition {
	const { frontmatter, body } = parseFrontmatter(content);
	const sections = extractSections(body);

	const result: ParsedToolDefinition = {
		name: String(frontmatter.name || ""),
		title: String(frontmatter.title || ""),
		description: String(frontmatter.description || ""),
		systemPrompt: "",
		userPromptTemplate: "",
		guidanceBullets: [],
		fallbackQuestions: [],
	};

	// Extract sections
	if (sections.system_prompt) {
		result.systemPrompt = String(sections.system_prompt);
	}

	if (sections.user_prompt_template) {
		result.userPromptTemplate = String(sections.user_prompt_template);
	}

	if (sections.guidance_bullets) {
		result.guidanceBullets = Array.isArray(sections.guidance_bullets)
			? sections.guidance_bullets
			: [String(sections.guidance_bullets)];
	}

	if (sections.fallback_questions) {
		result.fallbackQuestions = Array.isArray(sections.fallback_questions)
			? sections.fallback_questions
			: [String(sections.fallback_questions)];
	}

	return result;
}

/**
 * Convert parsed tool definition to PromptTemplate.
 */
export function toolDefinitionToTemplate(
	def: ParsedToolDefinition,
): PromptTemplate {
	return {
		scenario: def.name as ScenarioId,
		title: def.title || def.name,
		description: def.description || "",
		systemPrompt: def.systemPrompt || "",
		userPromptTemplate: def.userPromptTemplate,
		guidanceBullets: def.guidanceBullets,
	};
}

/**
 * Get fallback questions from parsed definition.
 */
export function getFallbackQuestionsFromDefinition(
	def: ParsedToolDefinition,
): ClarifyingQuestion[] {
	const questions = def.fallbackQuestions || [];
	return questions.map((text, idx) => ({
		id: `q${idx + 1}`,
		text,
		type: "free-text" as const,
	}));
}
