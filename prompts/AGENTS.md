# Agent Prompt-Writing Guidance

This document explains how to think about using this tool ecosystem and how to write effective agent prompts.

## Why Use This Tool Ecosystem

The tools in this repository help agents recover when they get stuck.

- **Escape being stuck.** Tools like `logic_is_too_complex` give agents a structured way to reset and move forward when reasoning becomes circular or tangled.
- **Simplify thinking.** Instead of adding more steps, these tools help agents step back, clarify goals, and try a different approach.
- **Recover gracefully.** When something goes wrong—missing information, failed attempts, unclear goals—agents can use these tools to diagnose the problem and continue.

These are *general thinking methods*, not domain-specific APIs. They are designed to help any agent, in any context, think more clearly.

## What Is a Good Agent Prompt

A good prompt teaches the agent **how to think**, not just **what to do**.

> `"如何思考" 比 固定的单一待办清单 更重要。`
> (How to think is more important than a fixed single to-do list.)

### Prefer stable thinking patterns

Rather than giving agents long, rigid checklists, focus on reusable thinking patterns:

- **Clarify goals and constraints** before acting.
- **Break down problems** into small, testable steps.
- **Call out missing information and assumptions** explicitly.
- **Use tools when stuck** (e.g., when reasoning becomes circular, when information is missing, when the user's goal is unclear).

These patterns apply across many situations, so agents can adapt rather than follow brittle scripts.

### Focus on reasoning, not just actions

A prompt that says "do X, then Y, then Z" can fail if the situation changes slightly.
A prompt that says "first, make sure you understand the goal; then, identify what's blocking you; then, propose a simple next step" works in many more cases.

## Guidelines and Examples

### "How to think" vs. "How to do"

| How to do (rigid) | How to think (flexible) |
|-------------------|-------------------------|
| "Step 1: Read file X. Step 2: Change line 42. Step 3: Save." | "First, re-read the user's request. Summarize the main goal. Identify what's blocking you. Propose a simple next step." |
| A long checklist of specific actions | A short protocol for reasoning through any problem |

The `logic_is_too_complex` tool is an example of a "how to think" prompt. It doesn't tell the agent what domain-specific action to take. Instead, it guides the agent to:

1. Re-anchor on the original goal.
2. Summarize what was already tried.
3. Propose a different approach.
4. Resolve critical unknowns.
5. Continue with focused execution.

This pattern works whether the agent is debugging code, writing documentation, or planning a project.

### Reusable thinking patterns

Here are some patterns you can use in your own prompts:

- **Re-anchor the goal.** Before continuing, summarize what the user actually wants in a few bullet points.
- **Summarize attempts.** List what you tried and why it didn't work.
- **Propose alternatives.** Design a new approach that avoids past failure reasons.
- **Validate assumptions.** State your assumptions explicitly, and check them when possible.
- **Ask for help.** If you're stuck, ask the user a clear, focused question.

These patterns help agents stay on track without prescribing every action.

## Summary

- Use this tool ecosystem when agents get stuck or reasoning becomes tangled.
- Write prompts that teach *how to think*, not just *what to do*.
- Prefer reusable thinking patterns over rigid checklists.
- When in doubt, step back, clarify the goal, and propose a simple next step.
