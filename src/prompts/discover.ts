// src/prompts/discover.ts

import fs from "node:fs";
import path from "node:path";

export type ScenarioTier = "core" | "extended";

export interface DiscoveredScenario {
        id: string;
        tier: ScenarioTier;
        markdown: string;
}

const PROMPTS_ROOT = path.resolve(__dirname, "../../prompts");

function normalizeScenarioId(folderName: string): string {
        const slug = folderName
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");

        if (!slug) {
                throw new Error(`Invalid scenario folder name: "${folderName}"`);
        }

        return slug;
}

function loadScenarioMarkdown(tier: ScenarioTier, folderName: string): string {
        const markdownPath = path.join(PROMPTS_ROOT, tier, folderName, "tool.md");
        return fs.readFileSync(markdownPath, "utf8");
}

export function discoverScenarios(): DiscoveredScenario[] {
        const tiers: ScenarioTier[] = ["core", "extended"];
        const discovered: DiscoveredScenario[] = [];

        for (const tier of tiers) {
                const tierPath = path.join(PROMPTS_ROOT, tier);
                if (!fs.existsSync(tierPath)) continue;

                const entries = fs.readdirSync(tierPath, { withFileTypes: true });
                for (const entry of entries) {
                        if (!entry.isDirectory()) continue;
                        const id = normalizeScenarioId(entry.name);
                        const markdown = loadScenarioMarkdown(tier, entry.name);
                        discovered.push({ id, tier, markdown });
                }
        }

        return discovered;
}
