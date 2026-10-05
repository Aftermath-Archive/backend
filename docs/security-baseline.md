# Backend security baseline before the 2.0 import

This branch is based on `feat/node-26-dependency-baseline` (upgrade PR #10).
The user approved public archive reads, active-account collaborative edits,
and admin-only incident/post-mortem deletion on 2026-10-05.

## Endpoint policy

| Endpoint | Access | Response / restrictions |
| --- | --- | --- |
| `POST /auth/register` | Public, throttled | Username/email/password only; always active TeamMember; safe account DTO. |
| `POST /auth/login` | Public, throttled | Uniform invalid-credential message; active account required. |
| `GET /auth/logout` | Active account | Client discards token; logout does not revoke it server-side. |
| `GET /incidents`, `/incidents/search`, `/incidents/:id` | Public | Bounded pages; search regex is escaped literal text. |
| `POST /incidents` | Active account | Creator from authentication; allow-listed fields only. |
| `PATCH /incidents/:id` | Active account | Collaborative edits; updater/resolution timestamp from server. |
| `DELETE /incidents/:id` | Admin | Removes incident and associated report. |
| `POST /incidents/:id/discussion` | Active account | Author from authentication; message 1–2000 characters. |
| `GET /post-mortems`, `/post-mortems/search`, `/post-mortems/:id` | Public | Bounded pages and literal search. |
| `POST/PATCH /post-mortems` (PATCH includes `/:id`) | Active account | Existing incident linkage; immutable attribution; bounded report/action fields. |
| `DELETE /post-mortems/:id` | Admin | Deletes the report and retains the incident. |
| `GET /users` | Admin | Paginated safe account DTOs. |
| `GET /users/:id` | Active account | Self/admin: safe account DTO; other members: `_id`, username and display profile only. |
| `PATCH /users/:id` | Self or admin | Username/email/profile only; self-only password change requires current password. Role/lifecycle/OAuth/IDs/operators rejected. |
| `DELETE /users/:id` | Self or admin | Atomic soft deactivation; old tokens cease to authenticate. |
| `/`, `/api-docs`, `/health/ready` | Public | Readiness returns 503 while MongoDB is disconnected. |

JWT identity/role are resolved against the current database account on every
protected request. Tokens include a non-negative `version` claim; legacy tokens
without this claim behave as version 0. Password changes and deactivation
increment the stored version. Passwords are excluded from default model reads,
hashed at cost 12 for registration/changes/seeds, and never included in DTOs.
Existing bcrypt hashes remain usable. Password creation/change inputs are
limited to 72 bytes to avoid bcrypt truncation; login also enforces this bound.

Incident/registration/account bodies reject unsupported fields. Report bodies
retain their existing behavior of ignoring unsupported fields after validation;
only allow-listed report/action-item fields reach Mongoose. Validation responses
do not echo submitted values. Unexpected failures return generic JSON responses.

## Configuration and consumer changes

Production startup requires `DATABASE_URL`, a randomly generated
`JWT_SECRET_KEY` of at least 32 bytes, and `CORS_ORIGINS` containing comma-separated
exact HTTPS origins. It validates `PORT` (default 8080), connects to MongoDB and
only then listens. Connection/startup/seed/drop failures produce nonzero exit
status without printing credentials. Set CORS origins for the actual frontend
hosting domains; the old arbitrary-origin reflection and blanket OPTIONS handler
are removed. Non-browser requests without Origin remain allowed.

Leave `TRUST_PROXY_CIDRS` empty for direct connections. Behind a reverse proxy,
configure only its real IP addresses/subnets, and ensure the proxy overwrites
forwarding headers. Broad/global trust is rejected. TLS terminates at the hosting
proxy and remains a deployment verification requirement.

All request bodies are JSON objects, limited to 64 KiB. Pagination is page 1–10000,
limit 1–100 (defaults 1/10). MongoDB query execution and disconnected buffering
are capped at five seconds. Incident listing remains an array and search retains
`{ incidentsQuery }`, but pagination now actually bounds the database query.
The frontend compatibility branch `feat/backend-security-compat` sends JWTs on
author lookups and retrieves incident pages in batches of 100, preserving its
existing client-side table. Anonymous archive readers see fallback author labels
because account-directory reads require login. Full server-side table filtering,
pagination and sorting should replace bulk client loading before archive scale
makes many page requests expensive. In-flight client loads are aborted on refresh
or unmount.

IP limits: API 300 requests / 5 minutes; login 20 / 15 minutes; registration
5 / hour; password-change attempts 10 / hour. Responses include standard
RateLimit headers and Retry-After on 429; IPv6 subnet normalization is enabled.
The default store is per process and resets on restart. Multiple replicas need
a shared store or equivalent edge enforcement; quotas should be tuned with real
traffic. Rate limiting is not a substitute for endpoint authorization.

Seed/drop entry points refuse general production databases; in production they
require matching dedicated demo configuration ending in `_demo`. Demo seeds
contain intentionally known credentials and must never be used as production
account provisioning. The confirmed manual reset workflow still has its separate
demo guard and environment setup requirements.

## Verification and remaining scope

Run `npm run lint` and `npm test -- --runInBand --coverage=false` under Node 26.
Unit/route tests exercise anonymous/member/admin/inactive accounts, forgery,
operator/scalar attacks, safe DTOs, password changes/token invalidation, bounded
pagination/literal search, CORS/Helmet/errors, rate limits and startup/tooling
failures. The real-MongoDB suite uses Node’s built-in runner (`npm run test:integration`),
avoiding Jest VM/driver compatibility problems. It skips unless explicitly configured.

GitHub CI provides an ephemeral MongoDB 8.0 service at
`INTEGRATION_DATABASE_URL=mongodb://127.0.0.1:27017/aftermath_security_test`.
Integration tests reject any other host or database name pattern, create test
accounts/incidents/reports, verify real hashes/projections/updates/deletion,
and drop only that disposable test database on completion. CI also starts the
production container, checks readiness and verifies anonymous PATCH returns 401.

Remaining work includes deployment TLS/proxy/environment verification, browser
visual checks, shared rate-limit storage for replicas, shorter-lived/refresh
sessions and server-side logout revocation, frontend server-side pagination,
atomic incident/report deletion and robust concurrent incidentAutoId allocation.
The count-based human incident ID allocator can collide under concurrent creation
or after deletions; database uniqueness prevents overwrites and conflicts are
reported safely, but a separate allocation/recovery change is still needed.
Do not treat this baseline as a completed penetration test or monorepo import.

Implementation references: [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/),
[rate-limit configuration](https://express-rate-limit.mintlify.app/reference/configuration),
and [Mongoose query API](https://mongoosejs.com/docs/api/query.html).
