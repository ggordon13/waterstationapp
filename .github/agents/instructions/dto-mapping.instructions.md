---
applyTo: "**/*.cs"
---

When generating mapping code:

- Mapping MUST be explicit
- Request DTO → Domain Model for commands
- Domain Model → Response DTO for output
- DTOs MUST NOT appear in repositories
- Domain Models MUST NOT appear in controllers
