# Database Structure Ruleset and Snapshot

Last updated: 2026-05-21
Owner: GitHub Copilot + project maintainers

## Session Rules (MUST FOLLOW)

1. At the start of every new chat/agent session, read this file before proposing database-related changes.
2. Database source of truth is `.github/agents/instructions/db-instructions.md`.
3. After every database-relevant change, update this file and `.github/agents/instructions/db-instructions.md` in the same session.
4. Keep database notes factual and concise: no TODO-only placeholders, no stale table names, no outdated platform assumptions.
5. Do not log secrets, credentials, or environment-specific sensitive values.

## Update Protocol (REQUIRED AFTER DB CHANGES)

When any database-relevant change happens, update all impacted sections:

- Source of Truth
- Tables and Relationships
- Keys and Item Shape
- Change Log

Minimum change-log entry format:

- Date: YYYY-MM-DD
- Files changed
- What changed
- Why it changed

## Source of Truth

- Primary datastore documentation: `.github/agents/instructions/db-instructions.md`
- Current project datastore: Amazon DynamoDB
- This project does not include `cmdset_app/public/database_schema.sql`.

## Tables and Relationships (Current)

### WaterStation

- Stores customer order records and related items in a single DynamoDB table.
- Partition Key: `pk`
- Sort Key: `sk`
- Known item attributes:
  - `customer`
  - `address`
  - `tag`
  - `quantity`
  - `mode`
  - `amount`
  - `status`
  - `createdAt`

### WaterStationCustomers

- Stores static customer master data.
- Partition Key: `customerId`
- Known item attributes:
  - `name`
  - `address`
  - `tag`
  - `createdAt`

## Business Rules

- Pickup = ₱30 per container
- Delivery = ₱35 per container
- Quantity range = 1–5
- Status values = `PENDING` or `COMPLETED`
- Tags represent grouped delivery areas

## Change Log

- 2026-05-21
  - Files changed: `.github/agents/instructions/database_structure.md`, `.github/agents/instructions/db-instructions.md`, `copilot-instructions.md`
  - What changed: Rebased database structure documentation to the actual DynamoDB-backed app and removed stale SQL schema references.
  - Why it changed: current repository uses DynamoDB and does not include the referenced SQL schema path.
