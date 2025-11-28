// src/prompts/discover.ts

import fs from "node:fs";
import path from "node:path";

export type ScenarioTier = "core" | "extended";

export interface DiscoveredScenario {
        id: string;
        tier: ScenarioTier;
        markdown: string;
}

export const SCENARIO_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const PROMPTS_ROOT = path.resolve(__dirname, "../../prompts");

export function assertValidScenarioFolderName(folderName: string): string {
        if (!SCENARIO_ID_PATTERN.test(folderName)) {
                const message =
                        `Invalid scenario folder name: "${folderName}". ` +
                        "Names must match the pattern /^[a-z0-9]+(-[a-z0-9]+)*$/";
                console.error(message);
                throw new Error(message);
        }

        return folderName;
}

function loadScenarioMarkdown(tier: ScenarioTier, folderName: string): string {
        const markdownPath = path.join(PROMPTS_ROOT, tier, folderName, "tool.md");
        return fs.readFileSync(markdownPath, "utf8");
}

export function discoverScenarios(): DiscoveredScenario[] {
        const tiers: ScenarioTier[] = ["core", "extended"];
        const discovered = new Map<string, DiscoveredScenario>();

        for (const tier of tiers) {
                const tierPath = path.join(PROMPTS_ROOT, tier);
                if (!fs.existsSync(tierPath)) continue;

                const entries = fs.readdirSync(tierPath, { withFileTypes: true });
                for (const entry of entries) {
                        if (!entry.isDirectory()) continue;
                        const id = assertValidScenarioFolderName(entry.name);
                        const markdown = loadScenarioMarkdown(tier, entry.name);

                        if (discovered.has(id)) {
                                const existing = discovered.get(id)!;
                                if (tier === "core" && existing.tier === "extended") {
                                        console.warn(
                                                `Duplicate scenario id "${id}" found in tiers "${existing.tier}" and "${tier}". Preferring core definition.`,
                                        );
                                        // Replace the extended version with the core version
                                } else if (tier === "extended" && existing.tier === "core") {
                                        console.warn(
                                                `Duplicate scenario id "${id}" found in tiers "${existing.tier}" and "${tier}". Keeping core definition.`,
                                        );
                                        continue;
                                } else {
                                        console.warn(
                                                `Duplicate scenario id "${id}" found in tier "${tier}". Keeping first encountered definition.`,
                                        );
                                        continue;
                                }
                        }

                        discovered.set(id, { id, tier, markdown });
                }
        }

        return Array.from(discovered.values());
}
