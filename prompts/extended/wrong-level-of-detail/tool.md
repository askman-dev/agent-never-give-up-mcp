---
name: wrong-level-of-detail
title: "Working at wrong level of detail"
description: "Use this when your work is at the wrong abstraction level—either too high-level when implementation is needed, or too detailed when planning is expected."
---

When you notice your work is at the wrong level of abstraction for what the user expects, follow this exact protocol step by step.

## 1. Identify the expected level

1. Re-read the user's request carefully.
2. Look for signals about what level of detail they want:
   - **Planning level**: "outline," "plan," "design," "approach," "high-level," "strategy."
   - **Implementation level**: "code," "implement," "fix," "create," "write," "build."
   - **Verification level**: "test," "check," "verify," "validate," "confirm."
3. Note any explicit instructions about what **not** to do (e.g., "don't write code yet").

Write down: "Expected level: *[Planning / Implementation / Verification]*."

## 2. Assess your current output

1. Look at what you have produced or are about to produce.
2. Categorize it:
   - **Planning level**: High-level descriptions, architecture discussions, pros/cons lists, general recommendations.
   - **Implementation level**: Actual code, configurations, specific commands, concrete patches.
   - **Verification level**: Test cases, validation steps, checking procedures.

Write down: "Current level: *[Planning / Implementation / Verification]*."

## 3. Identify the mismatch

1. Compare the expected level (Step 1) with your current level (Step 2).
2. Describe the mismatch:
   - **Too abstract**: User wants implementation, but you are providing high-level discussion.
   - **Too concrete**: User wants planning, but you are jumping into code.
   - **Wrong phase**: User wants verification, but you are still implementing (or vice versa).

Write down: "Mismatch: *[description]*."

## 4. Adjust to the correct level

Based on the mismatch identified in Step 3:

**If too abstract** (need to be more concrete):
- Stop discussing and start doing.
- Provide specific code, commands, or configurations.
- Show actual changes, not just descriptions of changes.

**If too concrete** (need to be more abstract):
- Stop coding and step back.
- Provide options, trade-offs, and recommendations.
- Wait for user approval before implementing.

**If wrong phase**:
- Pause current activity.
- Ask the user to confirm what phase they want to be in.

## 5. Deliver at the right level

After you complete Steps 1–4:

1. Produce output that matches the **expected level** from Step 1.
2. Before delivering, double-check: "Is this what the user asked for in terms of detail?"
3. If unsure, ask the user: "Would you like me to [plan/implement/verify] this?"
4. Continue working at the appropriate level until the user signals a change.
