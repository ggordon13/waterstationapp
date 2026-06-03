---
applyTo: "**/*.cs"
---

When generating repositories:

- Inject IUnitOfWork
- MUST NOT inject IDbConnection
- Use Dapper only
- Do not use Entity Framework
- All SQL must be explicit and parameterized
- Always use uow.Connection
- Always pass uow.Transaction (null if none)
- Repositories MUST NOT:
  - Manage transactions
  - Catch and swallow exceptions
  - Call other repositories
  - Apply business logic
