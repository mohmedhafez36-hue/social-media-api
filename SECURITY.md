# Security Measures

## 1. Rate Limiting

Rate limiting was implemented using `express-rate-limit`.

The purpose is to limit the number of requests a client can send within a specific time window.

### Implementation

The API uses a general rate limiter and stricter limits can be applied to sensitive endpoints such as login.

Example:

```ts
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
```

### Security Benefit

Rate limiting helps protect the API against:

* Brute-force attacks
* Excessive requests
* Credential-stuffing attempts
* Basic denial-of-service abuse

---

## 2. Security Headers

`Helmet.js` is used to add HTTP security headers to API responses.

### Implementation

```ts
import helmet from "helmet";

app.use(helmet());
```

The configured headers include:

* `Strict-Transport-Security`
* `X-Content-Type-Options`
* `X-Frame-Options`
* `Referrer-Policy`
* `Cross-Origin-Opener-Policy`
* `Cross-Origin-Resource-Policy`
* `X-Permitted-Cross-Domain-Policies`

### Additional Configuration

Express's `X-Powered-By` header is disabled:

```ts
app.disable("x-powered-by");
```

### Security Benefit

Security headers reduce risks such as:

* Clickjacking
* MIME-type sniffing
* Information disclosure
* Some cross-origin attacks
* Insecure transport usage

---

## 3. Input Validation and Sanitization

The API uses `Zod` to validate and normalize incoming data.

Examples include:

* Trimming unnecessary whitespace
* Validating email addresses
* Validating UUIDs
* Enforcing minimum and maximum string lengths
* Validating dates
* Restricting username characters

Example:

```ts
const createUserSchema = z.object({
    userName: z
        .string()
        .trim()
        .min(3)
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email(),

    password: z
        .string()
        .min(8),
});
```

### Security Benefit

Input validation helps prevent:

* Invalid data
* Unexpected application behavior
* Excessively large input
* Injection-related problems caused by improperly handled input

The application also uses Prisma's parameterized database queries instead of constructing SQL queries through string concatenation.

---

## 4. Authentication

The API uses JWT-based authentication.

After successful login, the access token is stored in an `HttpOnly` cookie.

```ts
res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
});
```

### Security Benefit

Using an `HttpOnly` cookie prevents client-side JavaScript from directly reading the access token.

This reduces the risk of token theft through some XSS scenarios.

---

## 5. Refresh Tokens

The API uses refresh tokens to obtain new access tokens without requiring the user to log in again.

Refresh tokens are:

* Stored in an `HttpOnly` cookie
* Hashed before being stored in the database
* Associated with a specific user
* Given an expiration date
* Revoked after rotation

### Refresh Token Rotation

When a refresh token is used:

1. The existing token is validated.
2. A new access token is generated.
3. A new refresh token is generated.
4. The old refresh token is revoked.
5. The new refresh token is stored as a hash.

### Security Benefit

Refresh token rotation limits the lifetime of an individual refresh token and allows revoked tokens to be rejected.

---

## 6. Password Security

User passwords are not stored as plaintext.

Passwords are hashed before being stored in the database, and the stored hash is compared during login.

### Security Benefit

If the database is compromised, attackers do not receive users' plaintext passwords.

---

## 7. Authorization

Authentication is separated from authorization.

Authentication determines:

> Who is the user?

Authorization determines:

> Is this user allowed to perform this action?

The API uses role-based authorization and ownership checks.

Examples include:

* Only the post owner or an administrator can delete a post.
* A comment can be deleted by its owner, the post owner, or an administrator.
* Authenticated users can access their own profile without providing their user ID in the URL.

### Security Benefit

Authorization prevents authenticated users from accessing or modifying resources they are not permitted to control.

---

## 8. CSRF Protection

Because authentication tokens are stored in cookies, the API implements CSRF protection.

A separate CSRF token is generated and stored in a cookie.

Unlike authentication cookies, the CSRF cookie is not `HttpOnly`, allowing the frontend to read it and send it in a custom request header.

Example:

```http
X-CSRF-Token: <csrf-token>
```

The server compares the CSRF token from the cookie with the token provided in the request header.

If the tokens do not match, the request is rejected.

### Protected Methods

CSRF protection is applied to state-changing requests such as:

* `POST`
* `PUT`
* `PATCH`
* `DELETE`

### Security Benefit

CSRF protection prevents attackers from using a victim's authenticated browser session to perform unauthorized state-changing requests.

---

## 9. CORS

Cross-Origin Resource Sharing is configured to allow requests from the trusted frontend origin.

Example:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

Credentials are enabled because the application uses cookies for authentication.

### Security Benefit

CORS restricts which origins are allowed to interact with the API through browser-based cross-origin requests.

CORS is not considered a replacement for CSRF protection.

---

## 10. Secure Cookies

Authentication cookies use security-related attributes:

```ts
{
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
}
```

### `HttpOnly`

Prevents JavaScript from directly reading authentication cookies.

### `Secure`

Ensures cookies are sent only over HTTPS in production.

### `SameSite`

Reduces the ability of cross-site requests to automatically include authentication cookies.

---

## 11. Error Handling

The API uses centralized error handling through an `AppError` class and error middleware.

Sensitive implementation details and unnecessary internal information should not be exposed to clients.

For example, authentication failures return a generic message such as:

```json
{
    "message": "Wrong email or password"
}
```

rather than revealing whether the email exists.

### Security Benefit

Centralized error handling reduces information disclosure and provides consistent error responses.

---

## 12. Database Security

The application uses PostgreSQL with Prisma ORM.

Prisma provides parameterized database operations, reducing the risk of SQL injection when queries are constructed through Prisma APIs.

Sensitive database credentials are stored in environment variables rather than being hard-coded in the source code.

Example:

```env
DATABASE_URL=...
JWT_SECRET=...
```

Environment files containing secrets should not be committed to version control.

---

## Security Summary

The application currently applies multiple layers of security:

| Security Measure           | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| Rate Limiting              | Reduce brute-force and request-abuse attacks                |
| Helmet                     | Add security-related HTTP headers                           |
| Input Validation           | Reject invalid and unexpected input                         |
| Input Sanitization         | Normalize appropriate user input                            |
| Password Hashing           | Protect stored passwords                                    |
| JWT Authentication         | Authenticate users                                          |
| HttpOnly Cookies           | Protect authentication tokens from direct JavaScript access |
| Refresh Token Rotation     | Reduce refresh-token reuse                                  |
| Authorization              | Restrict access to protected resources                      |
| CSRF Protection            | Prevent forged authenticated requests                       |
| CORS                       | Restrict browser-based cross-origin access                  |
| Secure Cookies             | Add cookie-level security controls                          |
| Centralized Error Handling | Reduce information disclosure                               |
| Prisma                     | Use parameterized database operations                       |
| Environment Variables      | Keep secrets outside source code                            |

## Conclusion

The application follows a layered security approach rather than relying on a single security mechanism.

Each security measure addresses a different class of threats, and the measures work together to improve the overall security of the backend API.
