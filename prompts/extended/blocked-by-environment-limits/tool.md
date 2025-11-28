---
name: blocked-by-environment-limits
title: "Blocked by environment limitations"
description: "Use this when you are blocked by environmental constraints like permissions, network access, missing tools, or context limits—not by logic or strategy."
---

When you notice that progress is blocked by environmental limitations rather than logical problems, follow this exact protocol step by step.

## 1. Identify the environmental blocker

1. Describe the specific action you are trying to perform.
2. Note the **exact error or limitation** you encountered.
3. Categorize the blocker type:
   - **Permission**: Insufficient access rights (file, network, API, etc.).
   - **Network/Resource**: Cannot reach external service, repository, or URL.
   - **Missing tool**: Required software, library, or dependency not available.
   - **Context limit**: Token limit, memory limit, or session constraints.
   - **Time limit**: Operation takes too long or times out.
   - **Other**: Describe the specific limitation.

Format:

- Action attempted: *[what you tried to do]*.
- Error/Limitation: *[exact message or description]*.
- Blocker type: *[Permission / Network / Missing tool / Context limit / Time limit / Other]*.

## 2. Confirm this is not a logic problem

1. Ask yourself: "Do I know **how** to do this if the environment allowed it?"
2. If yes, this is truly an environmental blocker.
3. If no, the problem might be strategic—consider using a different thinking tool.

Write down: "I know the solution, but the environment prevents execution: *[Yes / No]*."

## 3. List what you have already tried

1. Note any workarounds or alternative approaches you attempted.
2. For each, explain why it did not work.

Format:

- Workaround 1: *[what you tried]* — Did not work because: *[reason]*.
- Workaround 2: *[what you tried]* — Did not work because: *[reason]*.
- …

If you have not tried any workarounds, write: "No workarounds attempted yet."

## 4. Propose alternative paths forward

Consider these options based on the blocker type:

**For Permission blockers**:
- Ask the user to perform the action manually.
- Request the necessary access or credentials.
- Suggest a different approach that does not require the permission.

**For Network/Resource blockers**:
- Provide instructions for the user to fetch the resource.
- Suggest offline alternatives or cached data.
- Work with what is available locally.

**For Missing tool blockers**:
- Ask the user to install the required tool.
- Suggest an alternative tool that is available.
- Provide manual steps that do not require the tool.

**For Context/Time limit blockers**:
- Break the work into smaller pieces.
- Summarize and checkpoint progress.
- Ask the user to continue in a new session.

List **1–3 concrete alternatives**:

- Alternative 1: *[description]*.
- Alternative 2: *[description]*.
- …

## 5. Communicate clearly and proceed

After you complete Steps 1–4:

1. **Tell the user** exactly what is blocked and why.
2. Present your alternative paths from Step 4.
3. Ask the user which path they prefer, or if they can resolve the blocker directly.
4. If the user resolves the blocker, retry the original action.
5. If proceeding with an alternative, execute it and note the limitation for future reference.
