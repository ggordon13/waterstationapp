---
applyTo: "**/*.cs"
---

# Backend Architecture Constitution

This document defines **non‑negotiable architectural rules** for the backend.
GitHub Copilot MUST follow these rules when generating any backend code.
These rules are intentionally verbose to reinforce correct behavior.

---

## Technology Constraints
- Use Dapper only
- SQL must be explicit and readable
- Always parameterize queries
- Prefer named parameters
- ❌ Entity Framework MUST NOT be introduced
- ❌ DbContext MUST NOT exist in this solution

---

## Layer Responsibilities

### Controllers
- Thin controllers only
- No business logic
- HTTP concerns only
- Return IActionResult
- Validate inputs defensively

### Services / Handlers
- Coordinate business flow
- Own transaction boundaries
- Call one or more repositories
- Handle success and failure paths

### Repositories
- One repository per aggregate/root table
- SQL execution only
- No business decisions
- Do not coordinate other repositories
- Do not call other repositories

### Domain Models
- Represent core business concepts
- Internal to the application
- Not shaped for transport
- Not persistence specific

---

## Transactions & Unit of Work

### Core Principles
- **Services control transactions**, not repositories
- **Repositories never create or commit transactions**
- Unit of Work represents one business transaction boundary
- Unit of Work MUST support commit and rollback

### Ownership Rules
- Unit of Work is the sole owner of:
  - IDbConnection
  - IDbTransaction

### Connection Lifecycle
- Unit of Work MAY create the connection lazily
- Connection MUST NOT be opened in the constructor
- Connection MUST be reused for the lifetime of the Unit of Work
- Connection MUST be disposed when the Unit of Work is disposed

### Transaction Behavior
- Transaction may or may not be active
- Begin explicitly
- Commit on success
- Roll back on exception
- Dispose transaction after completion

---

## Dependency Injection Rules
- UnitOfWork MUST be registered as Scoped
- Repositories MUST be registered as Scoped
- Controllers use default ASP.NET Core lifetimes
- Domain Models MUST NOT be registered in DI

---

## DTOs vs Domain Models

### Domain Models
- Internal only
- No HTTP concerns
- No JSON attributes
- No database framework references
- No DTO references

Location:
/Domain/Models

### DTOs
- API boundary only
- Request and response payloads
- Flat, serialization‑friendly
- No business logic
- Validate with FluentValidation

Locations:
/Api/Dtos/Requests
/Api/Dtos/Responses

### Mapping Invariants
- Mapping MUST be explicit
- Domain Models and DTOs MUST NOT be used interchangeably
- Repositories MUST return Domain Models
- Controllers MUST only accept/return DTOs

### Mapping Direction Rules
- Request DTOs MAY be mapped to Domain Models
- Domain Models MAY be mapped to Response DTOs
- Domain Models MUST NOT depend on DTOs
- DTOs MUST NOT be mapped directly to persistence models

Mapping location:
/Application/Mappings
---

## JSON Serialization & Validation Standards

# JSON Library Selection

- **System.Text.Json MUST be used** for all JSON serialization and deserialization.
- **Newtonsoft.Json (Json.NET) MUST NOT be introduced** unless explicitly stated otherwise.

# JSON Schema Validation

- JSON Schemas MUST be stored as external `.json` files.
- schemas MUST reside under a dedicated `Schemas/` directory within the project.
- Schemas MUST NOT be embedded as string literals in code.


# Build and Runtime Expectations

- Schema files MUST be included in the application build output as **Content**.
- Schemas MUST be loaded at runtime using paths based on `AppContext.BaseDirectory`.
- Code MUST NOT assume execution from the project source directory.

✅ Example:
csharp
var schemaPath = Path.Combine(
    AppContext.BaseDirectory,
    "Schemas",
    "TestRequest.schema.json"
);

var schemaJson = File.ReadAllText(schemaPath);
var schema = JSchema.Parse(schemaJson);
---

## CQRS Alignment

### Commands
- Use Unit of Work
- May span multiple repositories

### Queries
- No Unit of Work required by default
- No transaction unless explicitly needed

---

## Error Handling Expectations
- Services MUST roll back Unit of Work on unhandled exceptions
- Repositories MUST NOT catch and swallow exceptions
- Exceptions MAY propagate to services
- Controllers SHOULD translate failures into HTTP responses
- Error shaping - Global filter/middleware

---

## Async Conventions
- All async methods MUST accept a `CancellationToken` parameter
- `CancellationToken` MUST be passed through to all Dapper calls
- Parameter name MUST be `cancellationToken`

---

## Nullable Reference Types
- `#nullable enable` MUST be present in all backend files
- Do NOT use the null-forgiving operator (`!`) except at deserialization boundaries
- Return types and parameters MUST explicitly declare nullability

---

## Pagination Conventions
- List endpoints MUST accept `page` (1-based) and `pageSize` query parameters
- Default `pageSize`: 20, maximum: 100
- List responses MUST use the following shape:
  ```json
  { "items": [], "totalCount": 0 }
  ```
- Repositories MUST accept and apply pagination parameters — never return unbounded result sets

---

## Anti‑Patterns (Copilot Must Avoid)

❌ Repositories creating connections
❌ Repositories beginning transactions
❌ Repositories committing or rolling back
❌ Services passing raw IDbTransaction objects
❌ Dapper calls without Unit of Work transaction
❌ Repositories returning DTOs
❌ Controllers returning Domain Models
❌ Shared cross‑layer models

---

### Naming Conventions
- Domain Models: Singular nouns (e.g., Order, TestPlan)
- Repositories: {Entity}Repository
- Services / Handlers:
  - Commands: {Verb}{Entity}CommandHandler
  - Queries: {Entity}{Query}QueryHandler
- Request DTOs: {Action}{Entity}Request
- Response DTOs: {Entity}{Result}Response
- Unit of Work: IUnitOfWork, UnitOfWork

---

## Summary for Copilot

- Treat Unit of Work as the transaction owner
- Treat services as transaction boundaries
- Treat repositories as transaction‑agnostic
- Always pass Unit of Work transaction into Dapper
- Preserve strict DTO / Domain separation

These rules are mandatory for all new backend code.
