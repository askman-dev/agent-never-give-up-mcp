---
name: bug_fix_always_failed
title: "Bug fix keeps failing"
description: "Use this when your bug fix attempts keep failing, and you need to break out of the loop with a fresh debugging strategy."
---

When you notice your bug fix attempts keep failing, follow this exact protocol step by step.

## 1. State the bug clearly

1. Describe the **exact symptom** (error message, unexpected behavior, test failure).
2. Note the **expected behavior** vs. **actual behavior**.
3. Identify where in the code the bug appears (file, function, line if known).

Keep this description factual and specific.

## 2. List what you already tried

1. List each fix attempt you made.
2. For each attempt, add **one short reason** why it failed.

Format:

- Attempt 1: *[what you tried]* — Failed because *[reason]*.
- Attempt 2: *[what you tried]* — Failed because *[reason]*.
- …

Be honest. If you tried the same approach twice, note that.

## 3. Identify what you have not tested

Consider these possibilities:

- Is the bug a symptom of a deeper issue?
- Are there related code paths you haven't examined?
- Have you added logging to trace the actual execution?
- Is the test itself correct?
- Did this code work before? What changed recently?

List **1–3 untested areas** that might reveal the root cause.

## 4. Propose a different debugging strategy

Based on Steps 1–3, design a **new approach** that is different from what you tried.

1. Write a short heading: `New debugging strategy`.
2. Outline **2–4 concrete steps** you can execute.

Example format:

- Step 1: Add logging at X to trace the value of Y.
- Step 2: Check if Z is being called as expected.
- Step 3: Run the test in isolation to rule out side effects.

Ensure this approach:

- Targets an untested area from Step 3.
- Avoids the failure reasons from Step 2.
- Starts with the simplest diagnostic step.

## 5. Execute and verify

After you complete Steps 1–4:

1. Follow your **new debugging strategy** from Step 4.
2. After each step, note what you learned.
3. If you find the root cause, fix it and verify the fix.
4. If you're still stuck, return to Step 3 and pick another untested area.
