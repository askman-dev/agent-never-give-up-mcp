---
name: scope-creep-during-task
title: "Scope is creeping beyond the task"
description: "Use this when your changes are expanding beyond the original task scope, and you need to refocus on what was actually requested."
---

When you notice your changes are expanding beyond what was originally requested, follow this exact protocol step by step.

## 1. Define the original task boundary

1. Re-read the user's original request.
2. Write down the **exact scope** of what was asked:
   - Which files or components should be changed?
   - What specific behavior should be added, fixed, or modified?
   - What should **not** change?
3. Note any explicit constraints the user mentioned.

Keep this boundary definition tight and specific.

## 2. List all changes you have made or planned

1. List every change you have made or are planning to make.
2. For each change, note:
   - File or component affected.
   - Type of change (bug fix, refactor, style, new feature, etc.).

Format:

- Change 1: *[file/component]* — *[type]*.
- Change 2: *[file/component]* — *[type]*.
- …

Include both completed and planned changes.

## 3. Categorize each change

For each change from Step 2, decide:

- **In scope**: Directly required by the original request.
- **Necessary extension**: Not explicitly requested, but required for the in-scope change to work.
- **Out of scope**: Not required for this task; a "nice to have" or unrelated improvement.

Format:

- Change 1: *[In scope / Necessary extension / Out of scope]*.
- Change 2: *[In scope / Necessary extension / Out of scope]*.
- …

Be strict. If in doubt, mark it as "Out of scope."

## 4. Remove or defer out-of-scope changes

1. For each "Out of scope" change:
   - If already made: **Revert it** or mark it for removal.
   - If planned: **Remove it** from your plan.
2. Note any out-of-scope items that might be valuable for a future task.

Format:

- Reverted/Removed: *[change]*.
- Deferred for later: *[change]*.

Do not try to justify keeping out-of-scope changes. Be disciplined.

## 5. Complete only what is needed

After you complete Steps 1–4:

1. Focus **only** on "In scope" and "Necessary extension" changes.
2. Before making any new change, ask: "Is this within the original task boundary?"
3. If you find yourself wanting to add more, stop and return to Step 3.
4. Complete the task with the **minimum changes** that satisfy the original request.
