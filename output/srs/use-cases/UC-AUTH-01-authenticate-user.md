# UC-AUTH-01: Authenticate User

| **Use Case ID:** | UC-AUTH-01 |
| **Use Case Name:** | Authenticate User |
| **Created By:** | BA Team | **Last Updated By:** | BA Team |
| **Date Created:** | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:** | Customer, Admin (primary) |
| **Description:** | User provides credentials (email + password or SSO token). System validates against identity provider and returns JWT access/refresh tokens. Successful outcome: user session established with role-based access. |
| **Preconditions:** | 1. User has registered account. 2. Identity provider is operational. |
| **Postconditions:** | 1. JWT access token issued (15 min TTL). 2. JWT refresh token issued (7 day TTL). 3. User session recorded. 4. Last login timestamp updated. |
| **Priority:** | High |
| **Frequency of Use:** | 5000–20000 times per day |
| **Includes:** | None |
| **Special Requirements:** | 1. Login response ≤ 500ms. 2. Account lockout after 5 failed attempts (30 min). 3. MFA support via TOTP. 4. Brute force detection with IP throttling. |
| **Assumptions:** | 1. User remembers their credentials. 2. Email service is available for password reset. |
| **Notes and Issues:** | TBD-4: Passkey/WebAuthn support — Security — Q2 2027. |

### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | User navigates to login page | |
| 2 | | System displays login form: email field, password field, "Sign In" button, "Forgot Password" link |
| 3 | User enters email and password, clicks "Sign In" | |
| 4 | | System validates input: non-empty fields, valid email format |
| 5 | | System checks account lockout status for this email |
| 6 | | System hashes password and compares with stored hash |
| 7 | | System resets failed attempt counter on success |
| 8 | | System generates JWT access token (15 min TTL) and refresh token (7 day TTL) |
| 9 | | System records login event: timestamp, IP, user agent |
| 10 | | System redirects to requested page (or default dashboard) |

### Exceptions

**EX.1: Invalid Credentials** — At step 6, if password hash mismatch:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System increments failed attempt counter |
| EX.1.2 | | System displays "Invalid email or password" (generic message, no field-specific hint) |
| EX.1.3 | | If attempts < 5, system returns to step 3 |
| **Final state:** Authentication failed; retry available (unless locked out) |

**EX.2: Account Locked** — At step 5, if failed attempts ≥ 5:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays "Account temporarily locked. Try again in N minutes or reset password" |
| **Final state:** Authentication blocked for lockout duration (30 min) |

**EX.3: MFA Required** — At step 8, if MFA is enabled for account:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System issues temporary token and redirects to MFA page |
| EX.3.2 | | System prompts for TOTP code |
| EX.3.3 | User enters TOTP code | |
| EX.3.4 | | System validates TOTP code |
| EX.3.5 | | System proceeds to step 8 (token generation) |
| **Final state:** Full authentication with MFA; tokens issued |
