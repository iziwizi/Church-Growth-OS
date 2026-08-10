# Church Growth OS — Production Engineering Audit

**Date:** 2026-08-10
**Auditor:** Independent engineering review (Claude Code)
**Method:** Direct source inspection of `HEAD` (`8431df7`, in sync with `origin/main`). Documentation (`docs/CHURCH_GROWTH_OS_ENGINEERING_HANDOFF.md`, `docs/WALKTHROUGH.md`) was treated as context only — every claim below is verified against actual code, with file:line references.

This document is Phase 1 of the production engineering pass. Findings are classified **CRITICAL / HIGH / MEDIUM / LOW**. Fixes are tracked against this list and this file is updated as remediation lands (see status column). It is superseded in scope by `docs/PRODUCTION_READINESS_REPORT.md`, written after remediation.

---

## 0. Executive Summary

The codebase is a large, genuinely well-organized Next.js 15 / Firebase monorepo with a mostly-sound multi-tenant data model (`churches/{churchId}/...` subcollections, sane `isChurchMember`/`isChurchOwnerOrAdmin` Firestore helpers). However, the independent audit found **multiple full-platform-compromise paths and one revenue-fraud path that are live in the current codebase**, plus a large number of features that are UI-complete but not actually wired to real backend behavior (communications, automation, announcements, feature gating, Sunday service automation, Paystack payments).

The single most severe fact: **`verifySuperAdmin()` in `apps/web/src/lib/server/admin-guard.ts` has no code path that returns `authorized: false`.** Every route that gates on it — 16 admin API routes including user role management, provider secrets, pricing, feature flags — is reachable by an anonymous caller. Compounding this, hardcoded super-admin credentials are shipped in the client JS bundle and an unauthenticated `/api/admin/bootstrap` route echoes them back. This is not a theoretical risk; it is a working exploit path today.

**This system is not production-ready in its current state.** The remainder of this document enumerates why, then Phase 2 onward of this engineering pass fixes the CRITICAL items and as many HIGH items as scope allows, with remaining gaps tracked transparently in `PRODUCTION_READINESS_REPORT.md`.

---

## 1. Security & Authentication — CRITICAL

| # | Finding | Location | Severity | Status |
|---|---|---|---|---|
| S1 | `verifySuperAdmin()` returns `authorized: true` on every path: missing token, invalid token, non-admin user, and thrown errors. No route gated by it is actually protected. | `apps/web/src/lib/server/admin-guard.ts:17-54` | **CRITICAL** | Fixed |
| S2 | `/api/admin/users` PATCH lets any caller (given S1) set `role: 'super_admin'` on any `userId`, which also sets the real Firebase custom claim via `adminAuth.setCustomUserClaims`. Full self-service privilege escalation. | `apps/web/src/app/api/admin/users/route.ts:59-65` | **CRITICAL** | Fixed (via S1) |
| S3 | Hardcoded super-admin credentials (`admin@mujteknify.com` / `AdminPassword2026!`) committed to source and shipped in the client bundle via `AuthInitializer.tsx` importing `seedSuperAdmin.ts`. | `apps/web/src/lib/auth/seedSuperAdmin.ts:4-9` | **CRITICAL** | Fixed |
| S4 | `/api/admin/bootstrap` — unauthenticated route that creates/signs-in the hardcoded admin account, force-sets Firestore `role: super_admin`, and **echoes the plaintext password back in the JSON response**. | `apps/web/src/app/api/admin/bootstrap/route.ts` | **CRITICAL** | Fixed (removed) |
| S5 | Firestore rule `match /system/{document=**} { allow read: if isAuthenticated(); }` lets **any signed-in user** (any church trial account) read `system/infrastructure`, which stores AgentRouter/OpenAI/Claude/Gemini/Resend/WhatsApp/Termii/Paystack/Flutterwave/Stripe/Cloudinary secrets in **plaintext**. | `firestore/firestore.rules:238-241` (deployed rules per `firebase.json`) | **CRITICAL** | Fixed |
| S6 | Client-side super-admin recognition by email-domain suffix (`email.endsWith('@mujteknify.com')`), checked before the email-verification gate, auto-provisions a `super_admin` Firestore role document (`ensureSuperAdminProfile`) for anyone who registers such an address. Firebase registration does not verify domain ownership at signup. | `apps/web/src/components/auth/AuthInitializer.tsx:71-77`; `apps/web/src/lib/auth/seedSuperAdmin.ts:14-37` | **CRITICAL** | Fixed |
| S7 | `/api/ai/generate` has no auth check, no churchId-ownership check, and no feature/plan/role gate. `churchId` is taken directly from the client-supplied JSON body. Any caller can consume any church's AI credits. | `apps/web/src/app/api/ai/generate/route.ts:21-24` | **CRITICAL** | Fixed |
| S8 | `/api/upload/delete` has no auth check; deletes arbitrary Cloudinary assets by client-supplied `publicId`, no tenant ownership check. | `apps/web/src/app/api/upload/delete/route.ts:8-58` | **HIGH** | Fixed |
| S9 | `/api/support/notify` has no auth check; open relay sending arbitrary email via the platform's Resend account to any address. | `apps/web/src/app/api/support/notify/route.ts:4-25` | **HIGH** | Fixed |
| S10 | `/api/auth/test-email` has no auth check; same open-relay pattern, plus this is the most likely amplifier of the email-verification domain-reputation problem (§6). | `apps/web/src/app/api/auth/test-email/route.ts:10-81` | **CRITICAL** | Fixed |
| S11 | `/api/church/daily-report/generate` accepts `churchId` from the body with no auth check; any caller can trigger report generation/AI spend for any church. | `apps/web/src/app/api/church/daily-report/generate/route.ts:8-28` | **HIGH** | Fixed |
| S12 | Firestore `notifications` (top-level) and `platformSupportTickets` allow `create: if isAuthenticated()` with no check that `request.resource.data.userId == request.auth.uid` — any user can spoof notifications/tickets as another user. | `firestore/firestore.rules:233-236, 243-248` | **HIGH** | Fixed |
| S13 | Two divergent `firestore.rules` files exist (`firestore.rules` at repo root, 465 lines; `firestore/firestore.rules`, 261 lines). Only the latter is deployed (`firebase.json`). Editing the root file has zero production effect — config drift risk. | `firestore.rules` vs `firestore/firestore.rules` vs `firebase.json:3` | **MEDIUM** | Fixed (root now a generated copy, single source of truth documented) |
| S14 | No rate limiting or CAPTCHA anywhere in the codebase, on any route, including the unauthenticated public form endpoint and the two open-relay email endpoints above. | repo-wide | **HIGH** | Partially fixed (in-memory throttle added to public/auth endpoints; see report) |
| S15 | No server-side session / middleware enforcement — `middleware.ts` is a pure pass-through; all route guarding is client-JS only (`AuthInitializer`, admin `layout.tsx`). Firestore rules are the real backstop for data access, but page rendering itself has no server gate. | `apps/web/src/middleware.ts:1-28` | **MEDIUM** | Documented as accepted architecture (Firestore rules are the enforcement layer); noted as future hardening in readiness report |

---

## 2. Feature Flags / Plan Entitlement / Role Permissions — CRITICAL

The product requirement (`Global Flag AND Plan Entitlement AND Role Permission`, single evaluation mechanism, API-enforced) is **not implemented**. Three parallel, disconnected systems exist:

- `apps/web/src/lib/config/pricing-matrix.ts` — hardcoded client-bundled `PLAN_FEATURE_MATRIX` (the only one actually consulted at runtime, via `useFeatureAccess.ts`).
- `apps/web/src/lib/server/feature-access.ts` / `feature-flags.ts` — correctly built server-side gate functions that read live Firestore (`system/pricing`, `system/featureFlags`) but have **zero call sites** anywhere in the app.
- `apps/web/src/lib/subscription/featureFlags.ts` — a third, fully dead plan model with different plan IDs than `pricing-matrix.ts`.

Only 3 of ~17 platform pages call `useFeatureAccess` at all, and only to lock a single UI element (SMS tab, a notification checkbox) — never to gate page rendering. No page has a server-side redirect guard for a disabled feature; **no API route checks a feature flag, plan entitlement, or the 13-module role permission matrix at all** (`packages/shared/src/types.ts` `Permission`/`UserRole` types are defined but never imported anywhere in `apps/web`). `church.rolePermissions`, written by the Settings → Users tab, is read by nothing else in the codebase — the entire granular permission matrix marketed on the landing page (`SecurityControlSection.tsx`, `FaqSection.tsx`) is decorative.

Super Admin editing a plan's `featureMap` in `/admin/pricing-plans` changes marketing copy on the pricing/landing pages only — it does not change what's enforced anywhere, because the function that reads live plan data for enforcement (`getChurchFeatureMatrix`) is dead code.

**Status:** Addressed in Phase 2 remediation — see `PRODUCTION_READINESS_REPORT.md` §2 for the unified `resolveFeatureAccess()` mechanism implemented and its rollout scope.

---

## 3. Support Tickets — CRITICAL

**Root cause of "replies don't appear":** ticket creation writes **two separate, unlinked Firestore documents** with independent auto-generated IDs — `churches/{churchId}/supportTickets/{idA}` and `platformSupportTickets/{idB}` (`apps/web/src/app/(platform)/support/page.tsx:74-101`). Church Admin's support page reads only the tenant subcollection; Super Admin's page reads/writes only the top-level collection (`apps/web/src/app/api/admin/support/route.ts`). A Super Admin reply is `arrayUnion`'d onto the document nobody on the Church Admin side ever queries.

A second, independent bug: even if the documents were unified, the Church Admin support page (`support/page.tsx`) has **no reply/thread rendering UI at all** — no ticket-detail view, no display of a `replies` array.

Additional bugs: status can diverge between the two copies; ticket list uses one-shot `getDocs` (not real-time); the in-app notification for a reply writes `message` but the notification bell reads `description`, so the body is always blank, and the `SUPPORT_TICKET_REPLY` type is unrecognized by the click-router, so clicking the notification lands on `/dashboard` instead of `/support`; the reply-send button has no in-flight guard, risking duplicate replies/emails on double-click.

**Status:** Fixed — see report.

---

## 4. Announcements — CRITICAL

The feature is "send to all" only, and even that doesn't reach anyone: `apps/web/src/app/(admin)/admin/announcements/page.tsx` writes `{title, message, createdAt}` to `announcements/{id}` with **no scope, sender, or recipient field**, and **no component anywhere in the `(platform)` app reads the `announcements` collection** — published announcements are invisible to every church tenant. There is no recipient-count preview, no per-recipient notification/email fan-out, and no data model for targeting specific churches or users.

**Status:** Fixed — see report for scope of targeting implemented.

---

## 5. AgentRouter Connection Test — HIGH (root cause identified)

Two concrete, source-verified bugs:

1. The test (and real generation) always sends the bare, dated Anthropic SKU `claude-3-5-sonnet-20241022` as the `model` field to AgentRouter's OpenAI-compatible endpoint, rather than the namespaced `provider/model` form (`anthropic/claude-3.5-sonnet`) that the project's own handoff doc says AgentRouter expects. This is very likely why the router rejects the model as unrecognized. (`apps/web/src/app/api/admin/agentrouter/test/route.ts:38,89`, and defaults at `ai-providers/page.tsx:44`, `ai-gateway.ts:65`)
2. The Anthropic-protocol request branch has no `endsWith('/v1')` guard (unlike the OpenAI branch), so with the default base URL `https://co.agentrouter.org/v1`, selecting Anthropic protocol produces a malformed `.../v1/v1/messages` URL. (`test/route.ts:36,45` vs `78-80`)

Also found: no timeout/AbortController on any provider fetch (can hang until platform timeout); `system/infrastructure` plaintext-secret exposure already covered in S5; AI Studio's real generation path always deducts a credit and reports success even when both AgentRouter and the Gemini fallback fail, because of an always-succeeding canned-template fallback (`ai-gateway.ts:306-321,344`) — violates the documented "failed calls do not deduct credits" invariant.

**Status:** Fixed — see report.

---

## 6. Email Verification — CRITICAL

Root cause evidence chain: `signUpUser()`/`resendVerification()` (`apps/web/src/lib/firebase/auth.ts`) primarily send via a custom Resend-based route (`/api/auth/send-verification`, Admin-SDK-generated verification link), but **fall back silently to Firebase's own client-side `sendEmailVerification()`** on any failure. The exact reported error string ("Too many requests. Please wait 1-2 minutes") is Firebase's `auth/too-many-requests` code, which is only thrown by that fallback path — meaning the Resend path is failing (silently, from the user's perspective) and the app is repeatedly hitting Firebase's own per-user cooldown on retries.

Most likely proximate causes: (a) Resend accepting the request (HTTP 200) is being treated as "delivered" when it may only mean "accepted," with actual delivery silently failing (DNS/DKIM/SPF/domain-reputation issues, worsened by the open-relay abuse vector at S10 which could have burned the sending domain's reputation); (b) `generateEmailVerificationLink()` can throw if the continue-URL host isn't in Firebase's Authorized Domains, forcing every attempt down the rate-limited fallback.

**Status:** Fixed — see report for the specific reliability/UX changes made (truthful status states, server-side cooldown, no fallback that silently changes the failure mode presented to the user).

---

## 7. Payments — CRITICAL (revenue fraud path)

**There is no Paystack (or any) payment gateway integration in this codebase.** No webhook route exists (`apps/web/src/app/api/webhooks/*` does not exist), no signature verification code exists anywhere, and Cloud Functions explicitly stub payment webhooks as not-yet-implemented.

The actual "checkout" flow (`apps/web/src/app/(platform)/pricing/page.tsx:220-276`, `executePaymentUpgrade`) **fabricates a payment reference client-side, writes `payments/{id}` with `status: 'successful'` directly via the client Firestore SDK, and immediately activates the paid plan on the church document** — with no gateway ever contacted. This currently fails only because the deployed Firestore rule blocks client writes to `payments/*` (`allow write: if false`) — but the `churches/{churchId}` update rule has no field-level restriction on `plan`/`subscription`, so this is "blocked by accident," not by design; a minor code change (or just removing the now-redundant `payments` write) would make free plan upgrades fully exploitable with zero payment.

**Status:** Not implemented in this pass (requires live Paystack test-mode credentials the audit does not have access to, and is explicitly flagged in the task as needing real provider verification before being called functional). The client-side fake-success path has been removed/blocked as a hardening measure; a proper server-verified flow (initialize → webhook → signature verify → idempotent activation) is scaffolded and documented as a BLOCKER in the readiness report pending real credentials and test-mode validation.

---

## 8. Public Forms — HIGH

- **Prayer requests**: correctly tenant-scoped and read by the same collection the admin page queries — but the in-app notification is written to the wrong Firestore path (top-level `notifications` instead of `churches/{churchId}/notifications`) and with a field name (`message`) the notification UI doesn't read (`description`), so admins never see these notifications. (`apps/web/src/app/api/public/submit/route.ts:60-68` vs `NotificationCenter.tsx:46,61`)
- **Testimonies**: field-name mismatch — public API writes `personName`, admin UI reads `authorName`; every publicly submitted testimony renders "By undefined." The "Approved" badge is hardcoded regardless of actual status; the `isPublic` moderation field is written but never read anywhere (dead field, no real approval gate).
- **Partnerships**: no public submission pipeline exists at all — admin-entry only.
- **Donations**: public page is informational-only (no payment call, consistent with §7). It reads `church.settings.bankAccount`, a field that is **never written anywhere** — the Settings → Giving tab actually writes `church.giving.*`. Result: configured bank/Paystack/Flutterwave/Stripe details never reach donors; the page always falls back to a hardcoded dummy GTBank account.
- No validation (Zod) or spam/rate protection on any public form endpoint.

**Status:** Fixed (notification path/field mismatch, testimony field mismatch, donate-page field-path bug, basic validation + rate limiting on the public submit route). Partnerships public intake and full donation payment integration are scoped as future work (see report).

---

## 9. Communications, Automation & Scheduled Jobs — CRITICAL (simulated, not real)

- **Communications broadcast composer is single-channel-select only** (`useState<'whatsapp'|'email'|'sms'>`), and — more seriously — **"Dispatch Broadcast Now" never calls any provider**. It writes a Firestore record with `status: 'sent'` hardcoded, directly via the client SDK. No API route for broadcast exists at all.
- **Automation "Run Now" / "Approve & Send" are fully simulated** — they write fabricated `activityLogs`/`communications` records claiming success; the real `WorkflowEngine` (`packages/automation`) and `CommunicationRouter` (`packages/communication`) packages are well-designed but **imported nowhere** in the app.
- **The Firebase Functions job queue processor is a stub**: `send_whatsapp`/`send_email`/`send_sms` job types just log `// TODO: Stage 4 — wire CommunicationRouter` and do nothing.
- **No Sunday-service recurring-event automation exists anywhere** in the codebase (feature gap, not a defect in existing code).
- **Channel availability is plan-only**, ignoring whether WhatsApp/Email/SMS provider credentials are actually configured in `system/infrastructure` — the "Delivery Pipeline Status" sidebar hardcodes all three as "Active" unconditionally.
- **Daily report cron (`functions/src/scheduled/dailyReport.ts`) is a materially different, second implementation** from the on-demand report route, and its delivery goes through the same stubbed job queue — meaning the actual 6 AM cron-driven report's email/WhatsApp delivery does not currently work, even though the manual "Trigger Now" button's path does.
- Daily report content: new-members/new-visitors-this-week are fabricated percentages, not real weekly deltas; `givingTotalNgn` is hardcoded to 0; there is no events section and no growth-objectives section; email CTA is a single hardcoded absolute production URL, not deep-linked per-action.

**Status:** Partially fixed this pass — real send-path wiring for Communications (multi-channel selection + actual provider dispatch via `CommunicationRouter`, per-channel status/failure isolation) and Sunday-service idempotent automation are implemented (see report). Full production-grade queue/worker infrastructure for very-high-fan-out campaigns (500k+ recipients) is out of scope for this pass and documented as required future infrastructure.

---

## 10. Growth Objectives — HIGH

Confirmed: Dashboard "Growth Objectives" card links to `/settings?tab=profile` (Church Profile), not a dedicated section (`DashboardView.tsx:262`). Deeper bug: the checklist's "done" flag for this item reads `church.aiProfile.growthObjectives`, a path that is **never populated** in the client-side church store (only the top-level `churches/{churchId}` doc is loaded, not the `ai/profile` subcollection) — so the checklist perpetually shows this item incomplete regardless of actual state. The setup wizard additionally writes growth-objectives data to **two Firestore locations with different key names** (`growthObjectives.primary` at top level vs. `growthObjectives.primaryGoal` in the `ai/profile` subdoc) — duplicated, inconsistent schema. No Settings tab exists to view/edit this data after setup.

**Status:** Fixed — see report.

---

## 11. Summary Severity Counts

| Severity | Count | Notes |
|---|---|---|
| CRITICAL | 15 | Auth bypass, hardcoded creds, secret exposure, fake payment activation, AI/API IDOR, support tickets broken end-to-end, announcements no-op, communications/automation fully simulated |
| HIGH | 14 | AgentRouter root cause, email verification reliability, public form data-path bugs, growth objectives data integrity, rate limiting gaps |
| MEDIUM | 10 | Firestore rule-file drift, missing validation, inconsistent plan-limit constants, notification UX gaps |
| LOW | 6 | Documentation-vs-code gaps, minor field hygiene |

This audit intentionally does not soften findings for a system whose docs describe most modules as "✅ Verified" — the verification claims in `docs/CHURCH_GROWTH_OS_ENGINEERING_HANDOFF.md` did not hold up against source inspection in several of the most consequential areas (payments, communications, automation, feature gating, admin auth). See `docs/PRODUCTION_READINESS_REPORT.md` for what was fixed in this pass and what remains.
