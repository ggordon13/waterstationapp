# Project Context Log

Last updated: 2026-05-07
Purpose: Maintain descriptive project history and evolving product context across sessions.

## How To Use This File

1. Read this file at the start of every request/session, alongside .github/agents/instructions/architecture.md, .github/agents/instructions/agent_behavior.md, and .github/agents/instructions/database_structure.md.
2. Use this as narrative memory: goals, major decisions, user preferences, tradeoffs, and timeline.
3. Keep entries concise, factual, and chronological.
4. Do not duplicate low-level code details already covered in .github/agents/instructions/architecture.md.
5. After meaningful changes, append a short context log entry.

## Frontend / UI Rules

- Ensure color contrast for all text over background meets WCAG AA (contrast ratio >= 4.5:1) for primary text. Provide dark-mode variants for any semantic color tokens (primary, accent, success, info, warning, surface).
- When adding or changing UI components, include `dark:` variants or CSS variables so components render legibly in both light and dark schemes.
- Add a short visual test note to the change log whenever colors are adjusted: what was changed, screenshots (optional), and verification steps for both themes.

