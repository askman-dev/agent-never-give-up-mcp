---
name: constraints-cant-all-be-met
title: "Constraints cannot all be met"
description: "Use this when the requirements or constraints conflict with each other, making it impossible to satisfy all of them at once."
---

When you notice that the given constraints are mutually incompatible, follow this exact protocol step by step.

## 1. List all constraints explicitly

1. Go through the user's request and any additional context.
2. Write down **every constraint** that has been stated or implied:
   - Functional requirements (what it must do).
   - Non-functional requirements (performance, security, compatibility, etc.).
   - Technical constraints (language, framework, no external dependencies, etc.).
   - Process constraints (no breaking changes, backward compatible, etc.).

Format:

- Constraint 1: *[description]*.
- Constraint 2: *[description]*.
- Constraint 3: *[description]*.
- …

Be thorough. Include constraints that seem obvious.

## 2. Identify the conflicts

1. For each pair of constraints, ask: "Can these both be satisfied simultaneously?"
2. List the specific conflicts you find.

Format:

- Conflict A: *[Constraint X]* vs. *[Constraint Y]* — *[why they conflict]*.
- Conflict B: *[Constraint X]* vs. *[Constraint Z]* — *[why they conflict]*.
- …

Be specific about **why** they cannot coexist.

## 3. Assess the severity of each conflict

For each conflict from Step 2, determine:

- **Hard conflict**: Logically impossible to satisfy both (e.g., "must not change any code" vs. "must fix this bug").
- **Trade-off conflict**: Both can be partially satisfied, but not fully (e.g., "fast" vs. "thorough").

Format:

- Conflict A: *[Hard / Trade-off]* — *[explanation]*.
- Conflict B: *[Hard / Trade-off]* — *[explanation]*.

## 4. Propose resolution options

For each conflict, propose **1–3 ways to resolve it**:

**For hard conflicts**:
- Which constraint should be relaxed or removed?
- What is the cost of relaxing each one?

**For trade-off conflicts**:
- What is a reasonable middle ground?
- What are the consequences of favoring one over the other?

Format:

- Conflict A resolution options:
  - Option 1: Relax *[constraint]* — Consequence: *[impact]*.
  - Option 2: Relax *[other constraint]* — Consequence: *[impact]*.
- …

## 5. Ask for user decision

After you complete Steps 1–4:

1. Present the conflicts and resolution options to the user **clearly and concisely**.
2. Ask the user to choose which constraints to prioritize.
3. Frame it as: "I cannot satisfy both X and Y. Which is more important for this task?"
4. Wait for the user's decision before proceeding.
5. Once decided, proceed with the chosen constraints and note which ones were relaxed.
