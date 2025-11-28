#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const PROMPTS_ROOT = path.resolve(__dirname, "../prompts");
const SCENARIO_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const tiers = ["core", "extended"];

let ok = true;
const seen = new Map();

function validateFolderName(tier, name) {
        if (!SCENARIO_ID_PATTERN.test(name)) {
                console.error(
                        `Invalid scenario folder name in ${tier}: "${name}". Names must match /^[a-z0-9]+(-[a-z0-9]+)*$/`,
                );
                ok = false;
                return false;
        }

        return true;
}

function validateToolMd(tier, name) {
        const toolMdPath = path.join(PROMPTS_ROOT, tier, name, "tool.md");
        if (!fs.existsSync(toolMdPath)) {
                console.error(`Missing required tool.md in ${tier}/${name}.`);
                ok = false;
                return false;
        }

        return true;
}

for (const tier of tiers) {
        const tierPath = path.join(PROMPTS_ROOT, tier);
        if (!fs.existsSync(tierPath)) continue;

        for (const entry of fs.readdirSync(tierPath, { withFileTypes: true })) {
                if (!entry.isDirectory()) continue;

                const id = entry.name;
                if (!validateFolderName(tier, id)) continue;
                validateToolMd(tier, id);

                if (seen.has(id)) {
                        const existing = seen.get(id);
                        if (existing === "core") {
                                console.warn(
                                        `Duplicate scenario id "${id}" found in tiers "${existing}" and "${tier}". Keeping core definition.`,
                                );
                                continue;
                        }
                }

                seen.set(id, tier);
        }
}

if (!ok) {
        console.error("Prompt checks failed.");
        process.exitCode = 1;
}

console.log("Prompt checks passed.");
