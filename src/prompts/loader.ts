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
	title: Record<string, string>;
	description: Record<string, string>;
	systemPrompt: Record<string, string>;
	userPromptTemplate: Record<string, string>;
	guidanceBullets: Record<string, string[]>;
	fallbackQuestions: Record<string, string[]>;
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
	let currentKey = "";
	let currentSubKey = "";
	let inMultilineValue = false;

	const lines = yamlContent.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmedLine = line.trim();

		// Skip empty lines
		if (!trimmedLine) continue;

		// Check for top-level key
		const topLevelMatch = line.match(/^([a-z_]+):\s*(.*)$/);
		if (topLevelMatch && !line.startsWith("  ")) {
			currentKey = topLevelMatch[1];
			const value = topLevelMatch[2].trim();
			if (value && !value.startsWith('"') && !value.startsWith("'")) {
				// Simple scalar value
				frontmatter[currentKey] = value;
			} else if (value) {
				// Quoted value
				frontmatter[currentKey] = value.replace(/^["']|["']$/g, "");
			} else {
				// Object or array starts
				frontmatter[currentKey] = {};
			}
			currentSubKey = "";
			inMultilineValue = false;
			continue;
		}

		// Check for nested key (like en: or zh-CN:)
		const nestedMatch = line.match(/^\s+([a-zA-Z-]+):\s*(.*)$/);
		if (nestedMatch) {
			currentSubKey = nestedMatch[1];
			const value = nestedMatch[2].trim();
			if (
				typeof frontmatter[currentKey] === "object" &&
				frontmatter[currentKey] !== null
			) {
				if (value) {
					// Remove quotes if present
					(frontmatter[currentKey] as Record<string, string>)[currentSubKey] =
						value.replace(/^["']|["']$/g, "");
				} else {
					(frontmatter[currentKey] as Record<string, string>)[currentSubKey] =
						"";
				}
			}
		}
	}

	return { frontmatter, body };
}

/**
 * Extract content sections from markdown body.
 */
function extractSections(
	body: string,
): Record<string, Record<string, string | string[]>> {
	const sections: Record<string, Record<string, string | string[]>> = {};
	const lines = body.split("\n");

	let currentSection = "";
	let currentLang = "";
	let currentContent: string[] = [];

	const saveCurrentContent = () => {
		if (currentSection && currentLang && currentContent.length > 0) {
			if (!sections[currentSection]) {
				sections[currentSection] = {};
			}
			const content = currentContent.join("\n").trim();

			// Check if content is a list
			if (content.startsWith("- ")) {
				sections[currentSection][currentLang] = content
					.split("\n")
					.filter((line) => line.startsWith("- "))
					.map((line) => line.slice(2).trim());
			} else {
				sections[currentSection][currentLang] = content;
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
			currentLang = "";
			continue;
		}

		// Check for H3 language header
		const h3Match = line.match(/^### (.+)$/);
		if (h3Match) {
			saveCurrentContent();
			const lang = h3Match[1].trim();
			// Map language names to codes
			if (lang === "English" || lang === "english" || lang === "en") {
				currentLang = "en";
			} else if (lang === "中文" || lang === "zh-CN" || lang === "Chinese") {
				currentLang = "zh-CN";
			} else {
				currentLang = lang;
			}
			continue;
		}

		// Collect content
		if (currentSection && currentLang) {
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
		title: (frontmatter.title as Record<string, string>) || {},
		description: (frontmatter.description as Record<string, string>) || {},
		systemPrompt: {},
		userPromptTemplate: {},
		guidanceBullets: {},
		fallbackQuestions: {},
	};

	// Extract sections
	if (sections.system_prompt) {
		for (const [lang, content] of Object.entries(sections.system_prompt)) {
			result.systemPrompt[lang] = String(content);
		}
	}

	if (sections.user_prompt_template) {
		for (const [lang, content] of Object.entries(
			sections.user_prompt_template,
		)) {
			result.userPromptTemplate[lang] = String(content);
		}
	}

	if (sections.guidance_bullets) {
		for (const [lang, content] of Object.entries(sections.guidance_bullets)) {
			result.guidanceBullets[lang] = Array.isArray(content)
				? content
				: [String(content)];
		}
	}

	if (sections.fallback_questions) {
		for (const [lang, content] of Object.entries(sections.fallback_questions)) {
			result.fallbackQuestions[lang] = Array.isArray(content)
				? content
				: [String(content)];
		}
	}

	return result;
}

/**
 * Convert parsed tool definition to PromptTemplate array.
 */
export function toolDefinitionToTemplates(
	def: ParsedToolDefinition,
): PromptTemplate[] {
	const templates: PromptTemplate[] = [];
	const languages = new Set<string>();

	// Collect all languages
	for (const lang of Object.keys(def.title)) {
		languages.add(lang);
	}
	for (const lang of Object.keys(def.description)) {
		languages.add(lang);
	}
	for (const lang of Object.keys(def.systemPrompt)) {
		languages.add(lang);
	}

	for (const lang of languages) {
		templates.push({
			scenario: def.name as ScenarioId,
			language: lang,
			title: def.title[lang] || def.title.en || def.name,
			description: def.description[lang] || def.description.en || "",
			systemPrompt: def.systemPrompt[lang] || def.systemPrompt.en || "",
			userPromptTemplate:
				def.userPromptTemplate[lang] || def.userPromptTemplate.en,
			guidanceBullets: def.guidanceBullets[lang] || def.guidanceBullets.en,
		});
	}

	return templates;
}

/**
 * Get fallback questions from parsed definition.
 */
export function getFallbackQuestionsFromDefinition(
	def: ParsedToolDefinition,
	language: string,
): ClarifyingQuestion[] {
	const questions =
		def.fallbackQuestions[language] || def.fallbackQuestions.en || [];
	return questions.map((text, idx) => ({
		id: `q${idx + 1}`,
		text,
		type: "free-text" as const,
	}));
}
