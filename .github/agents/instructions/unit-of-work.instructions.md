---
applyTo: "**/*.cs"
---

When generating Unit of Work code:

- Own a single IDbConnection
- Create connection lazily on first use
- Own optional IDbTransaction
- Begin transactions explicitly
- Commit or rollback exactly once
- Dispose transaction after completion
- Dispose connection with Unit of Work
