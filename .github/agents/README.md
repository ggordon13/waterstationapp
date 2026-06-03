# Agents Tips

## Prompt Files, Agents, or Skills?

Use prompt files for lightweight, single-task prompts.
Use custom agents when you need a persistent persona with its own tool restrictions and handoffs.
Use agent skills when you need a portable, multi-file capability with scripts and resources.

## Quick Decision Guide

- Choose a prompt file when the task is small and mostly instruction text.
- Choose a custom agent when you want reusable behavior, role boundaries, and tool constraints.
- Choose a skill when you need a repeatable capability that can include multiple files, scripts, and references.

## How To Create And Use Prompt Files

1. Create a markdown prompt file for a focused task.
2. Keep the prompt narrow: one clear outcome, key constraints, and expected output format.
3. Reuse it by selecting that prompt in Copilot Chat when you run similar tasks.

Recommended prompt content:

- Goal: one sentence outcome.
- Inputs: what files or context are expected.
- Rules: style, constraints, and exclusions.
- Output: exact format to return.

## How To Create And Use Custom Agents

1. Create or update an agent definition in this folder (for example, `code-generator.agent.md`).
2. Define the agent identity, scope, and hard rules.
3. Restrict tools to what the role needs.
4. Add subagent routing where needed (for example, `code-formatter`).
5. Invoke the agent by selecting it for tasks that match its role.

In this repository:

- `Code Generator`: implementation tasks.
- `Code Optimizer`: optimization-focused review and improvement.
- `Technical Writer`: documentation deliverables.
- `code-formatter`: formatting after code edits.

## How To Create And Use Skills

1. Create a skill folder that contains a `SKILL.md` and any supporting resources/scripts.
2. In `SKILL.md`, describe when the skill applies, what inputs are required, and expected outputs.
3. Keep the skill portable so it can be reused across tasks or repositories.
4. Load the skill before execution when the task matches the skill trigger.

Recommended `SKILL.md` structure:

- Purpose and scope.
- Trigger phrases or task types.
- Required inputs.
- Execution steps.
- Output contract.
- Limitations and non-goals.

## Best Practices

- Start with a prompt file for new workflows.
- Promote to a custom agent once behavior needs to be persistent.
- Promote to a skill once the workflow requires reusable multi-file logic.
- Keep instructions short, specific, and testable.
