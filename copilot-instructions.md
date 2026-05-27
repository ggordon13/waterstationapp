# Copilot Workspace Instructions

Before any implementation or refactor work in this repository:

1. Read .github/agents/instructions/architecture.md.
2. Read .github/agents/instructions/context.md.
3. Read .github/agents/instructions/agent_behavior.md.
4. Read .github/agents/instructions/db-instructions.md for the database side context.
5. Use .github/agents/instructions/backend.instructions.md when work depends on backend/API parity.
6. Follow the Session Rules and Update Protocol in .github/agents/instructions/architecture.md.
7. Follow the operating rules in .github/agents/instructions/agent_behavior.md.
8. If code changes alter structure, routes, module boundaries, conventions, features, or behavior, update .github/agents/instructions/architecture.md and .github/agents/instructions/context.md in the same session.
9. If database changes alter tables, constraints, views, DB naming, or DB behavior assumptions, update .github/agents/instructions/db-instructions.md in the same session.
10. If API contract context changes or backend sync work is requested, update .github/agents/instructions/backend.instructions.md in the same session.
11. If .github/agents/instructions/architecture.md and code differ, trust code first, then fix .github/agents/instructions/architecture.md immediately.
12. If .github/agents/instructions/db-instructions.md and the actual project datastore differ, trust the code/config first, then fix db-instructions.md immediately.

Agent routing preferences for this workspace:

1. Use `Code Generator` for code generation and implementation tasks.
2. Use `Technical Writer` for writing or generating documentation/text deliverables.
3. Use `Code Optimizer` for optimization-focused review and improvement tasks.
4. `Code Optimizer` must prioritize the most optimized implementation and replace unoptimized code when requested.
5. Use `code-formatter` after code changes to run Prettier formatting.
6. Use `git-committer` for commit message generation and git operations when requested, but never use destructive git commands unless explicitly requested.
7. Use `code-reviewer` for code review tasks when requested, but never use destructive operations.