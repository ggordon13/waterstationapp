---
applyTo: "**/*.ts, **/*.tsx"
---

When managing frontend state:

- Prefer local state unless shared
- Avoid redundant abstractions
- Use React Context for shared UI state (e.g., auth, theme, notifications)
- Do NOT introduce Zustand, Redux, or MobX unless explicitly approved
- Context providers must be colocated with the feature they serve — no single global "app store"
- Derived state must be computed, not duplicated