---
applyTo: "**/*.cs"
---

When generating services or handlers:

- Services define transaction boundaries
- Services decide if a Unit of Work is required
- Begin Unit of Work explicitly
- Call one or more repositories
- Commit on success
- Roll back on failure
- Services MUST NOT:
  - Contain HTTP logic
  - Access database directly
