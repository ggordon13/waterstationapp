# Architecture Ruleset and Snapshot

Last updated: 2026-05-07
Owner: GitHub Copilot + project maintainers

## Session Rules (MUST FOLLOW)

1. At the start of every new chat/agent session, read this file before proposing code changes.
2. If this file conflicts with the codebase, treat the codebase as source of truth, then immediately update this file.
3. After every architecture-relevant code change (add/update/delete/move), update this file and .github/agents/instructions/context.md in the same session before finishing.
4. For database-relevant changes, also read and update .github/agents/instructions/database_structure.md in the same session.
5. Keep architecture notes factual and concise: no TODO-only placeholders, no stale paths.
6. Record structural changes only (routing, folders, modules, shared contracts, state boundaries).
7. Do not log secrets, credentials, or environment-specific sensitive values.

## Update Protocol (REQUIRED AFTER CHANGES)

When any architecture-relevant change happens, update all impacted sections:

- Project Structure
- Routing and Navigation
- Module Boundaries and Responsibilities
- Key Conventions
- Change Log

When any feature or behavior change happens, update .github/agents/instructions/context.md timeline and decision sections in the same session.

Minimum change-log entry format:

- Date: YYYY-MM-DD
- Files/Folders changed
- What changed
- Why it changed
