---
applyTo: "**/*.cs"
---

When generating controllers:

- Accept Request DTOs
- Return Response DTOs
- Keep controllers thin
- No business logic
- No transaction management
- Return IActionResult

## Error Responses
- All error responses MUST use RFC 9457 Problem Details (`application/problem+json`)
- Use ASP.NET Core's built-in `ProblemDetails` and `ValidationProblemDetails` types
- Do NOT invent custom error envelope shapes
- 400 validation failures → `ValidationProblemDetails`
- 404 not found → `ProblemDetails` with a descriptive `detail` message
- 500 unhandled → generic `ProblemDetails` with no stack trace or internal details
