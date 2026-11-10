# Authentication flows

All authentication endpoints are mounted under `/api/auth`. Request bodies are
validated against the shared Zod contracts before they reach a controller. A
validation failure is passed to the API's error handling middleware.

## Register

**Endpoint:** `POST /api/auth/register`  
**Request:** `{ "username": "...", "email": "...", "password": "..." }`  
**Success:** `201 Created`

1. Validate that the username is non-empty, the email is valid, and the
   password is between 8 and 1024 characters.
2. Trim the username and trim and lowercase the email.
3. Look up the normalized email. If it is already registered, return an
   `EMAIL_ALREADY_EXISTS` conflict.
4. Look up the username. If it is already registered, return a
   `USERNAME_ALREADY_EXISTS` conflict.
5. Hash the password with Argon2id and generate a UUID for the new user.
6. In a database transaction, insert the user and its password credential.
   Database unique-constraint conflicts are also translated to the matching
   email or username conflict in case of a concurrent registration.
7. Return the new user's ID, username, and email. Registration does not
   currently verify the email or create a login session.

## Login

**Endpoint:** `POST /api/auth/login`  
**Request:** `{ "email": "...", "password": "..." }`  
**Success:** `200 OK`

1. Validate the email and ensure the password is non-empty and no longer than
   1024 characters.
2. Trim and lowercase the email, then load the user and password hash.
3. If the user is missing or the password does not match the Argon2 hash,
   return `401 INVALID_CREDENTIALS`.
4. If the account status is not `active`, return `403 FORBIDDEN`.
5. If the email is not verified, return `403 EMAIL_NOT_VERIFIED`.
6. Generate IDs for the login session, refresh-token family, and refresh
   token. Generate a cryptographically random refresh token and set its
   expiration to 30 days from now.
7. Generate a signed access token containing the user ID (`sub`), session ID
   (`sid`), and email. The access token expires after 15 minutes.
8. Store the session, token family, and SHA-256 hash of the refresh token in
   one database transaction. The raw refresh token is not stored in the
   database.
9. Return the user summary and access token. The controller also sets the raw
   refresh token in an `HttpOnly`, `SameSite=Lax` cookie; the cookie is marked
   `Secure` in production. The current controller response also includes the
   refresh token in its JSON body.

## Refresh access token

**Endpoint:** `POST /api/auth/refresh-token`  
**Input:** `refreshToken` cookie  
**Success:** `200 OK`

1. Read the refresh token from the request cookie. If it is absent or empty,
   return `401 INVALID_REFRESH_TOKEN`.
2. SHA-256 hash the presented token and find the corresponding session, token
   family, and user.
3. If no matching token exists, return `401 INVALID_REFRESH_TOKEN`.
4. Reject a revoked token, family, or session with `401 SESSION_REVOKED`.
5. Reject an expired refresh token or session with
   `401 REFRESH_TOKEN_EXPIRED`.
6. Reject an account that is not active or whose email is not verified.
7. Generate a replacement refresh token and a new 15-minute access token for
   the existing session.
8. In a database transaction, mark the old refresh token as revoked, extend
   the session expiry to the replacement token's 30-day expiry, and insert the
   replacement token's hash. If rotation fails, return
   `401 INVALID_REFRESH_TOKEN`.
9. Set the replacement refresh token in the same cookie configuration used by
   login and return the new access token, token type, and expiry.

## Request password reset

**Endpoint:** `POST /api/auth/forget-password`  
**Request:** `{ "email": "..." }`  
**Success:** `202 Accepted`

1. Validate the email, then trim and lowercase it.
2. Look up the account. Continue only when it exists, has `active` status, and
   has a verified email. Otherwise, skip challenge creation.
3. Generate a cryptographically random six-digit OTP and hash it with
   Argon2id. The raw OTP is not stored.
4. Store the new challenge in Redis under a user-specific key with a
   10-minute expiry and zero attempts. A new request replaces any earlier
   challenge for that user.
5. **Email delivery is not implemented yet.** There is a TODO for sending the
   OTP through an email service. The OTP is not returned by the endpoint, so a
   user cannot currently receive the code or complete a password reset until
   email delivery is added.
6. Return the same generic response whether or not an eligible account exists,
   to avoid revealing account registration status. The current response says
   reset instructions will be available once email delivery is configured.

## Reset password

**Endpoint:** `POST /api/auth/reset-password`  
**Request:** `{ "email": "...", "otp": "123456", "password": "..." }`  
**Success:** `200 OK`

1. Validate the email, require an exactly six-digit OTP, and require a new
   password between 8 and 1024 characters.
2. Trim and lowercase the email and find the account.
3. If the account is missing, inactive, or has an unverified email, return
   `401 INVALID_OR_EXPIRED_CODE`.
4. Find the user's reset challenge in Redis. Redis automatically removes the
   challenge after its 10-minute expiry.
5. If there is no eligible challenge or it already has five failed attempts,
   return `401 INVALID_OR_EXPIRED_CODE`.
6. Verify the submitted OTP against the stored Argon2 hash. On a mismatch,
   atomically increment the challenge's attempt count in Redis (up to five)
   and return `401 INVALID_OR_EXPIRED_CODE`.
7. On a match, hash the new password with Argon2id.
8. Atomically consume the challenge in Redis so it cannot be reused, then in
   one database transaction replace the password hash, update the
   password-change timestamp, increment the password version, and revoke the
   user's active sessions.
9. Return a password-reset success message. The user must log in again because
   existing sessions have been revoked.

## Current scope and follow-up

- Password-reset OTPs are securely hashed and stored in Redis, are single-use,
  expire after 10 minutes, and allow at most five incorrect attempts.
- A new password-reset request invalidates earlier unconsumed reset challenges
  for that user.
- Add and configure an email service to deliver reset OTPs. Until then, the
  reset-request endpoint creates a challenge that is not available to the
  user.
- Email verification is required for login and password reset, but registration
  does not currently send a verification email.
- No logout endpoint or access-token authentication middleware is described
  here; the flows above cover the currently implemented auth endpoints.
