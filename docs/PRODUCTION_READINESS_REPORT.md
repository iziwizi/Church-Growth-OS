# Church Growth OS — Production Readiness Report

**Date:** 2026-08-10
**Scope:** Independent engineering pass covering security, architecture, and the 11 functional phases specified for this review. This report supersedes `docs/PRODUCTION_ENGINEERING_AUDIT.md` as the authoritative statement of current state — the audit is the "before," this is the "after, with what's still open."

**Verdict up front: this system is closer to production-ready than it was at the start of this pass, but it is NOT production-ready today.** Every CRITICAL security hole found in the audit has been closed and verified (`type-check`, `lint`, `build` all pass for `apps/web`; Firebase Functions `type-check`/`build` also pass). Several major functional gaps remain, most importantly: no automated test suite exists anywhere in the repo, real payment/AI/WhatsApp credentials have not been exercised end-to-end in this environment, and feature-access enforcement — while now correctly implemented as a single mechanism — is only wired into two of the many gated code paths. See §19 (Launch Checklist) before treating any area as done.

---

## 1. Executive Summary

The codebase was a large, well-organized Next.js 15 / Firebase monorepo whose backend was, in several places, materially less finished than its UI and documentation suggested. The most severe finding — a fail-open Super Admin authorization guard combined with hardcoded credentials shipped in the client bundle and an unauthenticated bootstrap endpoint that echoed them — amounted to a live, trivially exploitable full-platform-compromise path. A second, independent path let any signed-up trial account read every platform provider secret in plaintext via Firestore. A third let the client fabricate a "successful payment" and activate a paid plan with zero gateway involvement. All three are fixed and verified.

Beyond security, roughly a third of the "channels" this product markets — outbound communications, the automation engine's execution step, Sunday-service scheduling, announcements, and support-ticket replies — were UI-complete but not functionally wired to anything real. Most of these are now real: broadcasts actually call WhatsApp/Email/SMS providers, Firebase Functions actually dispatch queued jobs, a Sunday-service event is idempotently ensured for automated-mode churches, announcements fan out with real targeting, and support tickets are a single two-way thread instead of two silently diverging documents.

## 2. Architecture Assessment

- Multi-tenant model (`churches/{churchId}/...` subcollections + `isChurchMember`/`isChurchOwnerOrAdmin` Firestore helpers) is sound and was not restructured.
- `packages/communication` and `packages/automation` (WorkflowEngine) are well-built but were entirely orphaned — nothing imported them. `packages/communication` is now wired into the real send paths (Communications compose, Firebase Functions job queue, Sermon publish-notify, daily report WhatsApp delivery). `packages/automation`'s `WorkflowEngine` remains unwired — see §19.
- Two divergent `firestore.rules` files existed with only one actually deployed (`firestore/firestore.rules` per `firebase.json`); the root copy is now a synced, clearly-labeled duplicate rather than a silent trap.
- A new `lib/server/feature-access.ts::resolveFeatureAccess()` is the single composed `Global Flag AND Plan Entitlement AND Role Permission` decision function the product spec calls for. It replaces three previously-disconnected systems (a hardcoded client matrix, dead server functions, a fully dead alternate plan model).

## 3. Security Assessment

| # | Finding (from the audit) | Status |
|---|---|---|
| S1 | `verifySuperAdmin()` always returned `authorized: true` | **Fixed** — default-deny, requires a verified Firebase ID token + `superAdmin`/`role` custom claim (Firestore role as fallback) |
| S2 | `/api/admin/users` PATCH let anyone self-grant `super_admin` | **Fixed** (via S1) |
| S3/S4 | Hardcoded `admin@mujteknify.com` credentials in client bundle + unauthenticated `/api/admin/bootstrap` echoing them | **Fixed** — file and route deleted; replaced with `apps/web/scripts/grant-super-admin.mjs`, a local-only CLI script run with the Admin SDK service account, never exposed as an endpoint |
| S5 | `system/infrastructure` (plaintext provider secrets) readable by any authenticated user | **Fixed** — Firestore rule now splits `system/pricing`, `system/featureFlags`, `system/maintenance` (authenticated-readable) from every other `system/*` document, including `infrastructure` (Super Admin only) |
| S6 | Client-side super-admin trust via `email.endsWith('@mujteknify.com')`, auto-provisioning a `super_admin` Firestore role | **Fixed** — removed from `AuthInitializer`, `admin/layout.tsx`, `admin/login/page.tsx`; replaced with custom-claim / Firestore-role checks only |
| S7 | `/api/ai/generate` had no auth, no ownership check, no feature/plan gate | **Fixed** — requires a verified token, enforces `churchId` ownership, and calls `resolveFeatureAccess` for the `ai_studio` feature |
| S8–S11 | `/api/upload/delete`, `/api/support/notify` (deleted), `/api/auth/test-email`, `/api/church/daily-report/generate` unauthenticated | **Fixed** — auth added to each; `test-email` restricted to Super Admin; `upload/delete` additionally checks the asset's `churches/{churchId}/` path prefix against the caller's own church |
| S12 | Unbound `notifications`/`platformSupportTickets` creates (spoofable `userId`) | **Fixed** — rules now require `request.resource.data.userId == request.auth.uid` |
| S13 | Divergent `firestore.rules` files | **Fixed** — root file is now a labeled, synced copy; `firestore/firestore.rules` is the single edited source |
| S14 | No rate limiting anywhere, including two open-relay email endpoints | **Partially fixed** — an in-memory sliding-window limiter (`lib/server/rate-limit.ts`) is applied to email-sending, public-form, AI-generation, ticket, and payment-initialization routes. **This is a stopgap**, not a production-grade limiter — see §19. |
| S15 | No server-side session/middleware enforcement | **Unchanged by design** — `middleware.ts` remains a pass-through; Firestore rules and the now-fixed API auth checks are the real enforcement layer. Documented as an accepted architecture, not a gap, but noted for future hardening (e.g., signed session cookies) in §19. |
| — | A user could self-write `role: 'super_admin'` to their own `users/{uid}` doc (client-writable), which the admin-guard's Firestore fallback would then trust | **Fixed** — the `users/{userId}` update rule now blocks a self-update from changing its own `role` field; only a Super Admin (or the Admin-SDK-backed `/api/admin/users` route) can change it |

Newly found and fixed during remediation (not in the original audit list):
- `lib/services/infrastructureService.ts::getInfrastructureConfig()` read `system/infrastructure` via the **client SDK** — dead code today, but would have broken (correctly, per the new rule) the moment anything called it. Left as dead code rather than resurrected, since the correct pattern (server-side `system/infrastructure` reads, availability-only booleans exposed to the client via `/api/feature-access`) is what the new Communications channel-availability logic actually uses.
- Every Super Admin console page's `fetch('/api/admin/...')` calls had no `Authorization` header — fixing `verifySuperAdmin` to require one would have silently broken the entire admin console. All ~30 call sites across 15 admin pages were updated to a new `lib/adminFetch.ts` wrapper that attaches a fresh ID token.

## 4. Authentication Assessment

Registration → email verification → login → setup is unchanged in structure but hardened:
- `/api/auth/send-verification` now returns a truthful, typed status (`sent` / `already_verified` / `rate_limited` / `config_error` / `provider_error`) instead of a bare boolean, with server-side per-email (60s) and per-IP (10/hr) rate limits.
- The client (`signUpUser`/`resendVerification`) no longer blindly falls back to Firebase's own client-side mailer on every failure — it only does so for genuine provider/config errors, never for rate limiting, which is what previously caused the reported "wait 1-2 minutes" cascade (repeated fallbacks quickly exhausted Firebase's own per-user cooldown).
- A 60s client-side cooldown timer on the "Resend Verification" button prevents the rapid-click pattern that triggered the cascade in the first place.
- Root cause candidates identified but **not independently confirmed without live Resend dashboard access**: (a) Resend accepting a send (HTTP 200) does not mean it was delivered — SPF/DKIM/DMARC state for `mujteknify.com` was not verifiable from this environment; (b) the now-closed `/api/auth/test-email` open relay could plausibly have damaged sending-domain reputation before this pass. **Recommend checking the Resend dashboard's domain verification and bounce/complaint rate before relying on this flow in production.**

## 5. Multi-Tenant Assessment

Core isolation (`isChurchMember`, `isChurchOwnerOrAdmin`) was already sound and is unchanged. New/fixed isolation gaps:
- `/api/ai/generate`, `/api/upload/delete`, `/api/church/daily-report/generate`, `/api/communications/broadcast`, `/api/support/tickets`, `/api/support/reply`, `/api/payments/paystack/initialize` all now verify the caller's `churchId` (from a server-verified token/Firestore lookup) against the requested resource, rather than trusting a client-supplied `churchId`.
- `platformSupportTickets` Firestore rules now scope read/update to the caller's own `churchId` custom claim, not just the original creator's `uid` — any staff member of a church can now see and reply to that church's tickets, matching how the feature is actually used.

**Not independently re-tested in this pass**: direct-API IDOR probing across two real church tenants (Test 20 in the task's acceptance plan) was not executed against a live deployment — see `REAL_WORLD_ACCEPTANCE_TEST_PLAN.md`.

## 6. Database (Firestore) Assessment

- Rules rewritten (see §3) with a clearer create-safe/read-update-delete helper split, comprehensive subcollection coverage (the deployed file previously had fewer collections modeled than the undeployed root file — merged the better structure in), and the `churches/{churchId}` update rule now blocks `plan`/`subscription` field changes from any non-Super-Admin, non-webhook writer.
- No new composite indexes were added; the daily-report route's new `donations` date-range query and `events` upcoming-date query use existing single-field patterns compatible with the current `firestore.indexes.json` — **verify in the Firebase console after first deploy that no missing-index errors appear**, since this wasn't testable without a live project.
- N+1 reads were not systematically audited in this pass beyond what the original audit flagged; `/api/admin/churches` GET still does a per-church subcollection read in a loop, which will not scale past a few hundred churches (flagged for future work, not fixed — out of scope given the volume of higher-severity work).

## 7. API Assessment

29 API routes existed at audit time; this pass added 7 new routes (`/api/feature-access`, `/api/payments/paystack/initialize`, `/api/webhooks/paystack`, `/api/support/tickets`, `/api/support/reply`, `/api/communications/broadcast`, `/api/admin/announcements`) and removed 2 (`/api/admin/bootstrap`, `/api/support/notify`). Every mutating route that previously trusted client-supplied identity now verifies a Firebase ID token server-side via `lib/server/auth-guard.ts` (regular users) or `lib/server/admin-guard.ts` (Super Admin).

## 8. AI Assessment

- AgentRouter test-connection: fixed the two concrete bugs found (un-namespaced model ID sent to a router that expects `provider/model` aliases; a double `/v1` in the Anthropic-protocol branch when the base URL already ends in `/v1`), added a 15–20s request timeout via `AbortController` to both the test route and the real generation path (neither had one before — a slow/unreachable AgentRouter would previously hang until the platform's own function timeout).
- The always-succeeding offline template fallback in `executeAIGateway` no longer deducts an AI credit or reports plain `success: true` — it now returns `usedTemplateFallback: true` and the upstream provider error, and both AI Studio and the Sermon Workspace's "AI Assist" surface this as a warning toast rather than a false success.
- **Not verified**: an actual live AgentRouter API key, OpenAI key, or Gemini key was not available in this environment, so the fix is verified by code inspection and the (corrected) request-shape logic, not by a live round-trip. Test with a real key before considering this "done."

## 9. Automation Assessment

- Firebase Functions' `processJobQueue` executor (`send_whatsapp`/`send_email`/`send_sms`) was a pure stub (`// TODO: Stage 4`); it now actually calls `CommunicationRouter` with platform credentials read from `system/infrastructure`. **Nothing currently enqueues jobs of these types** (only `ai_morning_declaration`/`birthday_check` are enqueued today) — the wiring is real and tested via `tsc`/`build`, but has no live traffic to exercise it yet.
- New `ensureSundayServiceEvents` scheduled function (daily, 4 AM UTC): idempotent via (a) skipping churches already in Manual/Approval mode, (b) checking for any existing event titled with "Sunday"+"service" on the upcoming Sunday before creating one, and (c) a deterministic `sunday-service-<date>` document ID so even a duplicate run on the same date is a no-op. Default time is read from `system/featureFlags.defaultSundayServiceTime` (falls back to `09:00`), never hardcoded per-church.
- `advance_workflow` job type and `packages/automation`'s `WorkflowEngine` remain **unwired** — nothing calls `WorkflowEngine.enroll()`. The executor now logs a clear warning instead of silently pretending to advance a workflow, but building the actual member-lifecycle → enrollment trigger (e.g., in `functions/src/triggers/members.ts::onMemberCreate`) is future work.
- The `(platform)/automation` page's "Run Now" / "Approve & Send" actions were **not** rewired to `CommunicationRouter` in this pass — they still write fabricated `activityLogs`/`communications` records claiming success without dispatching anything. This is a known, documented gap (see §19) — the Communications *compose* page and the Functions job queue are real; the Automation *engine's* own execution path is not yet.

## 10. Communication Assessment

- Compose UI now supports selecting any combination of WhatsApp/Email/SMS (not just one at a time), backed by a real `/api/communications/broadcast` route that calls `CommunicationRouter` per channel with full isolation (one channel's failure/lack of configuration never blocks the others) and records real per-channel sent/failed counts instead of a hardcoded `status: 'sent'`.
- Channel availability (shown as locked/unavailable in the UI) is now derived from three real signals — platform feature flag, plan entitlement, and whether the platform actually has WhatsApp/Resend/Termii credentials configured — via `/api/feature-access`, not a single hardcoded `hasSms` check.
- Sermon publishing can optionally notify members through this same real broadcast path (email + WhatsApp), as an explicit, separately-confirmed action — never automatic.
- **Not tested with real provider credentials.** `MetaCloudProvider`/`ResendProvider`/`TermiiProvider` were code-reviewed as functionally correct (real API calls, correct request shapes) but not exercised against live WhatsApp Business/Resend/Termii accounts in this environment.

## 11. Email Assessment

See §4 for verification-email hardening. Support-ticket and announcement emails now consistently use the same verified-domain `RESEND_FROM_EMAIL` env var (previously `lib/email/resend.ts` hardcoded a *different*, likely-unverified domain, `notifications@churchgrowthos.com`, which was silently failing deliverability independent of the Firebase-fallback issue).

## 12. Support Assessment

Root cause fixed: ticket creation previously wrote two separate, unlinked Firestore documents (`churches/{id}/supportTickets/{a}` and `platformSupportTickets/{b}`); Super Admin replies landed on the document the Church Admin side never read. Now:
- Single canonical `platformSupportTickets` collection, real-time (`onSnapshot`) on the Church Admin side.
- A real reply-thread UI now exists on the Church Admin support page (previously absent entirely, independent of the storage bug).
- Notification field/type mismatches fixed (`message`→`description`, unrecognized `SUPPORT_TICKET_REPLY` type→`alert`), so the notification bell now shows real content and routes to `/support` on click.
- In-flight guards added to both reply buttons to prevent duplicate-reply/duplicate-email on double-click.
- The former `/api/support/notify` open relay (unauthenticated, accepted arbitrary `to`) is deleted; ticket creation and replies now go through authenticated `/api/support/tickets` and `/api/support/reply`, which resolve the platform support address server-side rather than trusting client input.

## 13. Billing / Payments Assessment

**This was the most consequential functional gap found.** No Paystack (or any) integration existed; the "checkout" flow fabricated a payment reference client-side and activated the paid plan directly, with the Firestore rule blocking the direct `payments/*` write being the *only* thing standing between that code path and free plan upgrades for anyone.

Now implemented:
- `/api/payments/paystack/initialize`: server-side price re-derivation (never trusts a client-supplied amount), creates a `pending` payment record, calls Paystack's real `/transaction/initialize` endpoint, returns the hosted checkout URL.
- `/api/webhooks/paystack`: verifies `X-Paystack-Signature` (HMAC SHA512) against the raw body before parsing anything; idempotent via a transactional claim on a `processedWebhookEvents/{reference}` document (a replayed/retried webhook is a documented no-op, not a double-credit); re-verifies the transaction server-to-server via Paystack's `/transaction/verify` endpoint before trusting the webhook payload's own success claim; only then activates the plan and writes the payment as `successful`.
- The Firestore `churches/{churchId}` update rule now blocks any non-Super-Admin write to `plan`/`subscription`, closing the "blocked by accident" gap the audit flagged.
- Flutterwave/Stripe are **explicitly disabled** in the UI ("Coming soon") rather than left silently non-functional or faked.

**BLOCKER for real launch**: this flow has been implemented to the correct architecture and passes `type-check`/`build`, but **has not been exercised with a real Paystack test-mode key** — no such credential was available in this environment. Per the task's own instruction, do not switch to production Paystack credentials until a full test-mode run (successful payment, failed payment, duplicate webhook delivery, subscription activation) has been manually verified.

## 14. Performance Assessment

Not a focus area of this pass beyond what naturally improved (e.g., real-time `onSnapshot` replacing a one-shot `getDocs` for support tickets). No systematic bundle-size, query-cost, or rendering-performance work was done. First Load JS remains ~103 kB shared, consistent with pre-existing figures.

## 15. Scalability Assessment

See `docs/PRODUCTION_ENGINEERING_AUDIT.md` §9/§18 groundwork. Concretely for this pass:
- The new Announcements fan-out and Communications broadcast both iterate recipients/churches synchronously within a single request (`Promise.all` over the target list). This is fine at current realistic scale (tens to low hundreds of churches, hundreds of recipients per broadcast) but **will not scale to the "500,000 recipients" scenario the task describes** — that requires a real queue (Cloud Tasks, or the existing `scheduledJobs` collection processed by `processJobQueue`, extended to fan out per-recipient jobs instead of per-request synchronous sends). Documented as required future infrastructure, not built in this pass.
- Rate limiting is in-memory/per-instance (see §3, S14) — fine for abuse-dampening on a single Vercel instance, not a true distributed limiter. Recommend Upstash Redis (or similar) before any serious traffic.

## 16. Observability Assessment

Server routes consistently log to `console.error`/`console.warn` with a `[MODULE_TAG]` prefix (pre-existing convention, followed for all new code). No structured logging, request correlation IDs, or external log aggregation (Sentry, Datadog, etc.) were added — this remains a gap for diagnosing production incidents at scale. Secrets are never logged (verified by inspection of all new/changed code).

## 17. Testing Assessment

**No automated test framework exists anywhere in this repository** (`package.json` files, `apps/web`, and a repo-wide search for `*.test.*`/`*.spec.*` all confirm zero test infrastructure). This is unchanged from before this pass. Given the volume of higher-severity security and functional work in this session, standing up a test framework and writing a meaningful suite was not attempted — it would have consumed the remaining time budget without addressing a single CRITICAL finding. **This is the single largest remaining gap before real production launch** and should be the next major workstream: at minimum, integration tests for auth/authorization (the exact class of bug that was CRITICAL here), tenant isolation, and the Paystack webhook's idempotency guarantee.

## 18. Deployment Assessment

- `apps/web`: `type-check`, `lint` (0 errors, pre-existing warnings only), and `build` all pass cleanly.
- `functions`: `tsc --noEmit` and `tsc` (the actual build step used by `firebase deploy`) both pass cleanly after wiring `CommunicationRouter` and adding `ensureSundayServiceEvents`.
- **Not deployed or smoke-tested against a live Firebase project** — no deploy credentials/access in this environment. The Firestore rules rewrite in particular should be deployed to a staging project and exercised against Tests 19–21 in the acceptance plan before touching production.
- `apps/web/scripts/grant-super-admin.mjs` is the new, correct way to provision the first Super Admin — run it locally with the service account env vars before deploying, since the insecure bootstrap route it replaces no longer exists.

---

## 19. Remaining Risks & Launch Checklist

Classified per the task's own scale: **BLOCKER** (must fix before real churches use this), **HIGH**, **MEDIUM**, **LOW**, **FUTURE**.

### BLOCKER
1. **No automated tests.** Every fix in this pass was verified by `type-check`/`lint`/`build` and manual code review, not by a regression suite. A single untested edge case in the auth/payment code paths just rewritten could reintroduce a CRITICAL issue silently.
2. **Paystack flow untested with real test-mode credentials.** Architecture is correct; a live round-trip (success, failure, duplicate webhook) has not been run.
3. **Firestore rules rewrite not deployed/verified against a live project.** Deploy to staging and run Tests 19–21 from the acceptance plan before production.
4. **No deploy/smoke test of Firebase Functions** (`ensureSundayServiceEvents`, the now-real job executor) against a live project.

### HIGH
5. Feature-access enforcement (`resolveFeatureAccess`) is wired into only 2 of the many gated paths (`/api/ai/generate`, `/api/communications/broadcast`). Store, Live Service, Giving, and several other modules still write directly via the client Firestore SDK with no plan/flag/role check beyond basic tenant membership — a disabled feature is still reachable there.
6. `(platform)/automation` page's Run Now/Approve actions still simulate execution instead of calling `CommunicationRouter` (unlike the Communications compose page, which is now real).
7. `WorkflowEngine` (packages/automation) remains fully unwired — no member-lifecycle trigger enrolls anyone.
8. Rate limiting is in-memory/single-instance — replace with a distributed limiter (Upstash Redis) before real traffic.
9. Sidebar/MobileNav still render all nav items regardless of plan/flag/role (cosmetic only — the underlying API/feature-access layer is the real gate where it's been wired, but this is inconsistent UX and should be finished).

### MEDIUM
10. `/api/admin/churches` GET does an N+1 subcollection read per church — will not scale past a few hundred tenants.
11. Announcement/broadcast fan-out is synchronous per-request — needs a real queue for very high recipient counts.
12. Flutterwave/Stripe payment gateways are stubbed/disabled, not implemented.
13. No structured logging / correlation IDs / external error tracking.
14. Firestore composite indexes for the new date-range queries (donations, events) not verified against a live project — may need to be added via the Firebase console on first deploy.

### LOW
15. Email-verification deliverability root cause (Resend domain reputation/DKIM) identified as a strong hypothesis but not independently confirmed without dashboard access.
16. `packages/ai`, the third orphaned AI client package, remains unused (the real path is `lib/server/ai-gateway.ts`, which is correct — this is just dead code worth removing eventually).

### FUTURE
17. Real queue-based infrastructure (Cloud Tasks or similar) for mass communications/announcements at 100k+ recipient scale.
18. WABA (WhatsApp Business API) self-serve embedded signup per church, rather than platform-shared credentials only.
19. Full 13-module role-permission enforcement across every page and API route (currently only plumbed through `resolveFeatureAccess`'s optional `roleModule` parameter on the two wired routes).

**This system should not be described as "production ready" while any BLOCKER item above is open.** The security posture is now sound to the depth this pass could verify; the remaining work is primarily testing, live-credential verification, and finishing the rollout of mechanisms that are now correctly built but not yet applied everywhere they need to be.
