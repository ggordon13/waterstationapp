---
applyTo: "**/*.cs, **/*.ts, **/*.tsx"
---

# Testing Rules

## Shared Principles
- Test behaviour, not implementation
- Tests MUST NOT verify internal method calls
- No shared mutable state between tests — each test that writes data must clean up after itself

---

## Backend

### Tools
- xUnit
- FluentAssertions
- Moq or NSubstitute

### Scope
- Unit tests validate behaviour, not infrastructure
- No database, no HTTP, no filesystem access in unit tests
- Do NOT mock Dapper or IDbConnection directly

### Layer Rules
- Domain tests: no mocks, pure logic only
- Service tests: mock repositories and external services using their interfaces
- Repository tests: MUST run against a real test database — do NOT unit test SQL
- Controller tests: do NOT test controller actions directly — test via services

### Naming
- Class: `{ClassName}Tests` (e.g., `AssetServiceTests`)
- Method: `{MethodName}_{WhenCondition}_{ExpectedOutcome}`

### Anti-Patterns
❌ In-memory databases
❌ EF Core test utilities
❌ Mocking Dapper or SqlConnection directly
❌ Testing controller actions directly

---

## Frontend

### Tools
- Vitest
- React Testing Library

### Scope
- Test components and hooks independently
- API calls MUST be mocked

### Rules
- Never test internal component state directly
- Prefer queries by role/text over test IDs
- Hooks tested via `renderHook` only

### Anti-Patterns
❌ Enzyme
❌ Snapshot tests
❌ Testing implementation details
❌ Mocking React internals
