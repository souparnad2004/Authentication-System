# API architecture

The API is organized by feature. Inside a feature, files are grouped by their
responsibility in the request flow:

- **Presentation** translates HTTP requests and responses.
- **Application** coordinates a user goal without depending on HTTP or a
  particular database.
- **Domain** contains the concepts and rules that define the feature.
- **Infrastructure** connects the application to concrete tools such as the
  database and password hashing library.

## User registration

The registration endpoint is `POST /api/auth/register`. A successful request
returns HTTP `201` with the new user's public ID, username, and normalized
email. The password and password hash are never included in the response.
The reusable request, response, route, and error shapes live in
`packages/contracts`; the API validates and returns data using those shared
definitions.

The request moves through these steps:

1. `packages/contracts/src/auth/auth.contract.ts` defines the HTTP method,
   route, status, and request/response schemas as one contract.
2. `auth.routes.ts` connects the contract route to the controller.
3. `auth.controller.ts` validates the request body with the shared schema,
   calls the registration use case, and formats the successful response using
   the shared response type.
4. `register-user.use-case.ts` normalizes the username, constructs the email
   value object, checks for existing identities, hashes the password, creates
   the user, and asks the repository to save it. It returns only public user
   fields.
5. `email.vo.ts` normalizes email casing and enforces the domain's email
   format rule.
6. `user.entity.ts` represents a user in the domain, including the password
   hash needed by persistence.
7. `drizzle-user.repository.ts` implements the domain repository using
   Drizzle. It writes the user and password credential in one transaction.
   Database unique constraints remain the final protection against duplicate
   emails or usernames when concurrent requests pass the earlier checks.
8. `argon2-password-hasher.ts` adapts Argon2id to the application password
   hashing port. Argon2 generates a fresh random salt for each hash.
9. The API app's `index.ts` mounts the auth router and returns errors that
   conform to the shared API error contract.
10. `auth.module.ts` wires the use case, repository, hasher, controller, and
    router together. This is the composition point; it keeps infrastructure
    construction out of the use case.

### User login

`POST /api/auth/login` looks up the user and password credential, refuses
unverified accounts, and verifies the password with the shared Argon2id hasher.
On success it creates a JWT access token and a high-entropy refresh token,
persists the session and refresh-token hash in one database transaction, and
returns the public user fields with both tokens. Configure `JWT_SECRET` before
starting the API. Email delivery is not configured yet, so unverified accounts
receive an explicit `EMAIL_NOT_VERIFIED` error; the API does not claim to send a
verification link.

### Auth module file map

| File                                                                     | Why it exists                                                                                 | Used by                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `application/ports/password-hasher.port.ts`                              | Defines the hash and verify operations the application needs without naming a crypto library. | `RegisterUserUseCase`, `Argon2PasswordHasher`         |
| `application/use-cases/register-user.use-case.ts`                        | Coordinates the registration business workflow.                                               | `auth.module.ts`                                      |
| `domain/entities/user.entity.ts`                                         | Represents the user created by the business workflow.                                         | `RegisterUserUseCase`, `DrizzleUserRepository`        |
| `domain/errors/identity.errors.ts`                                       | Gives duplicate email and username failures explicit domain meaning.                          | Use case, repository, API error handler               |
| `domain/repositories/user.repository.ts`                                 | Defines the persistence operations the application requires.                                  | Use case, Drizzle repository                          |
| `domain/value-objects/email.vo.ts`                                       | Keeps email normalization and validity rules together.                                        | Use case, API error handler                           |
| `infrastructure/persistence/drizzle-user.repository.ts`                  | Implements user lookup and transactional persistence with Drizzle.                            | `auth.module.ts`                                      |
| `infrastructure/security/argon2-password-hasher.ts`                      | Implements password hashing with Argon2id.                                                    | `auth.module.ts`                                      |
| `presentation/http/auth.controller.ts`                                   | Adapts the validated HTTP request to the use case and shapes the response.                    | Auth router                                           |
| `presentation/http/auth.routes.ts`                                       | Declares the HTTP method/path-to-controller mapping.                                          | `auth.module.ts`                                      |
| `auth.module.ts`                                                         | Constructs and connects the feature's dependencies.                                           | API app entry point                                   |
| `apps/api/src/common/middleware/error-handler.middleware.ts`             | Maps validation and domain errors to shared API error responses.                              | API app entry point                                   |
| `packages/contracts/src/auth/requests/register-user.request.schema.ts`   | Defines the registration request validation schema.                                           | API controller, client applications                   |
| `packages/contracts/src/auth/responses/register-user.response.schema.ts` | Defines the registration response schema.                                                     | API controller, client applications                   |
| `packages/contracts/src/auth/auth.contract.ts`                           | Defines auth endpoint metadata and connects request and response schemas.                     | Auth routes, API app entry point, client applications |
| `packages/contracts/src/common/api-error.schema.ts`                      | Defines the shared error response shape and allowed error codes.                              | API error handler, client applications                |

### Naming conventions

- Use `*.use-case.ts` for application workflows and name the class
  `VerbNounUseCase`, for example `RegisterUserUseCase`.
- Use `*.input.ts` for application inputs. These are not HTTP DTOs and should
  not depend on Express or the request schema library.
- Name infrastructure implementations after the concrete technology, such as
  `Argon2PasswordHasher` and `DrizzleUserRepository`.
- Keep HTTP schemas and controllers in `presentation/http`; keep persistence
  and cryptography in `infrastructure`.
- Use `PascalCase` for classes and types, `camelCase` for values and
  functions, and `kebab-case` filenames.
- In `packages/contracts`, group schemas under feature `requests/` and
  `responses/` directories, suffix filenames with `.request.schema.ts` or
  `.response.schema.ts`, and export the supported public API from `src/index.ts`.
  See [the contracts package guide](../packages/contracts/README.md) for the
  complete layout and naming rules.
