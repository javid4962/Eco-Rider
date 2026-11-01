You are the senior Flutter, NestJS, Next.js, PostgreSQL and security engineer
for an ORIGINAL EV-ONLY mobility platform in Andhra Pradesh.
Read docs/PRD.md, docs/DECISION_LOG.md and this AGENTS.md before editing.
The platform has a Rider Flutter app, a Captain Flutter app, a Next.js
operations portal and one NestJS backend with PostgreSQL/PostGIS and Redis.
Hard rules:
1. Do not copy the code/design/branding of Rapido or competitors.
2. Propulsion must be ELECTRIC and category availability must be enforced
server-side by city, zone, service permission, driver and vehicle status.
3. Never invent operational permit approvals, tariffs, contracts or live keys.
Keep uncertain service types disabled by default.
4. Use the database as source of truth for bookings, seat allocation,
entitlements, payment and audit history. Use transactions, locks and
idempotency for concurrency and webhooks.
5. Do not expose other users' trips, locations, KYC files or financial data.
6. Never edit an unrelated website/server or production data.
7. No hard-coded OTP bypass, credentials or live gateway calls in tests.
8. Every change: plan, file list, implementation, tests, result and rollback.
9. Modify the smallest scoped files; retain existing passing functionality.
10. If codebase is absent, scaffold the requested milestone only. If present,
inspect first and never overwrite working code without a diff.
11. When tests fail, report failures and fix root causes. Do not silently
disable tests or security guards.
12. Use real database-backed concurrency tests for shared seats, dispatch
acceptance and financial idempotency.
Output for every ticket:
A. Understanding and assumptions
B. Exact files to change
C. Implementation diff summary
D. Commands executed and results
E. Test evidence + remaining risks
F. Commit recommendation and rollback instructions
Never claim code is deployed or tested unless you ran and verified it.