import fs from "node:fs";
import path from "node:path";
import {
        SCENARIO_ID_PATTERN,
        assertValidScenarioFolderName,
        type ScenarioTier,
} from "../src/prompts/discover";

const PROMPTS_ROOT = path.resolve(__dirname, "../prompts");

function getTierPath(tier: ScenarioTier): string {
        return path.join(PROMPTS_ROOT, tier);
}

function checkScenarioFolder(tier: ScenarioTier, folderName: string): boolean {
        let valid = true;
        if (!SCENARIO_ID_PATTERN.test(folderName)) {
                console.error(
                        `Invalid scenario folder name in ${tier}: "${folderName}". Names must match /^[a-z0-9]+(-[a-z0-9]+)*$/`,
                );
                valid = false;
        } else {
                // Ensure we throw the same error discover would throw when loading.
                assertValidScenarioFolderName(folderName);
        }

        const toolMdPath = path.join(getTierPath(tier), folderName, "tool.md");
        if (!fs.existsSync(toolMdPath)) {
                console.error(
                        `Missing required tool.md in ${tier}/${folderName}. Each scenario must include a tool.md file.`,
                );
                valid = false;
        }

        return valid;
}

function main() {
        const tiers: ScenarioTier[] = ["core", "extended"];
        let ok = true;
        const seenIds = new Map<string, ScenarioTier>();

        for (const tier of tiers) {
                const tierPath = getTierPath(tier);
                if (!fs.existsSync(tierPath)) {
                        continue;
                }

                const entries = fs.readdirSync(tierPath, { withFileTypes: true });
                for (const entry of entries) {
                        if (!entry.isDirectory()) continue;
                        const folderName = entry.name;
                        if (!checkScenarioFolder(tier, folderName)) {
                                ok = false;
                                continue;
                        }

                        if (seenIds.has(folderName)) {
                                const existingTier = seenIds.get(folderName);
                                console.warn(
                                        `Duplicate scenario id "${folderName}" found in tiers "${existingTier}" and "${tier}". The core version will be used.`,
                                );
                        } else {
                                seenIds.set(folderName, tier);
                        }
                }
        }

        if (!ok) {
                process.exitCode = 1;
                console.error("Prompt checks failed.");
                return;
        }

        console.log("Prompt checks passed.");
}

main();
