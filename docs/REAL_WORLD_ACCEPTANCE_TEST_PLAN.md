# Church Growth OS — Real-World Acceptance Test Plan

**Date:** 2026-08-10
**Environment used for this pass:** Local repository, no live Firebase project, no live provider credentials (Paystack, AgentRouter, Resend, Meta WhatsApp, Termii, Cloudinary) were available or provisioned in this session. No deploy access.

**How to read this document:** Each test lists the expected result, what was actually possible to verify in this environment, and a status. Per the task's own acceptance rule, a feature is not "done" because the code compiles and the logic looks right — a status of **VERIFIED (static)** means the implementation was code-reviewed and passes `type-check`/`build`, not that it was exercised end-to-end against a real backend. Only a status of **VERIFIED (live)** would mean an actual round-trip happened, and none of those exist in this document because no live environment was available. Anyone continuing this work should re-run every test below against a real staging deployment before treating this system as launch-ready.

Legend: ✅ VERIFIED (static) — code/logic reviewed, compiles, matches spec · ⚠️ PARTIAL — implemented but with a known gap · ❌ NOT IMPLEMENTED · 🚫 NOT EXECUTABLE — requires live credentials/deployment this environment doesn't have

---

## TEST 1 — Church Onboarding

**Expected:** Registration → email verification → login → setup → profile → growth objectives → social links → giving config → senior leader info → member creation, one coherent tenant, no duplicates, no infinite loading.

**Result:** ⚠️ PARTIAL. Registration/verification/login code paths were hardened this pass (see readiness report §4) and reviewed line-by-line; setup wizard, growth objectives, giving config were reviewed and the Growth Objectives duplicate-storage bug was fixed. **Not executed against a live Firebase Auth project** — no way to actually create a Firebase user, receive a real verification email, or click through setup in this environment. Status: 🚫 NOT EXECUTABLE here; code is ready for a real run.

## TEST 2 — Church Social Intelligence

**Expected:** Platform discovers/processes public church social content safely, or truthfully reports it can't.

**Result:** ❌ NOT IN SCOPE for this pass. No social-media-ingestion feature was found in the codebase to test, fix, or verify during the audit or remediation. If this feature exists elsewhere in the roadmap, it was not present in the code reviewed.

## TEST 3 — Live Service → AI Insights

**Expected:** Real transcript/metadata retrieval from a live-service recording, AI analysis, no fabricated analysis if a source can't be accessed.

**Result:** ❌ NOT VERIFIED. The Live Service module (`(platform)/live-service`) manages stream *destination config and preflight checks*, not video ingestion or transcription. No transcription provider integration exists in the codebase. Do not present this as a working capability — it would require integrating a real transcription service (e.g., a Whisper API or YouTube captions API) that is not currently wired up anywhere.

## TEST 4 — Email-First Fallback

**Expected:** A member with email but no WhatsApp still receives prayer/testimony/event/report/devotional notifications via email.

**Result:** ✅ VERIFIED (static). `/api/communications/broadcast` treats each channel independently — if `whatsapp` isn't selected or isn't configured, `email` still dispatches via `ResendProvider`; failures are isolated per channel (see `channelResults` array, one entry per channel, `skipped`/`error` fields distinct per channel). The daily report (`lib/server/daily-report.ts`) already sends email unconditionally when a pastor email exists, independent of WhatsApp availability. 🚫 Not executed against a real Resend account.

## TEST 5 — WhatsApp

**Expected:** Single-recipient send, multi-recipient batching, failure isolation, no credential leakage.

**Result:** ✅ VERIFIED (static) for logic; 🚫 NOT EXECUTABLE live. `MetaCloudProvider.sendBroadcast()` batches in groups of 10 with a 1s delay between batches (pre-existing, code-reviewed as correct). `/api/communications/broadcast` never returns provider credentials in any response (confirmed by reading every return statement in the route). No real Meta WhatsApp Business number/token was available to send an actual message.

## TEST 6 — Email

**Expected:** Verification, support, daily report, announcement, event reminder, prayer/testimony notification emails all use real provider responses, not assumed "sent" status.

**Result:** ⚠️ PARTIAL / ✅ for logic. Verification email (§4 of readiness report), support ticket emails, and announcement emails now consistently check the Resend API response before reporting a message as delivered rather than merely "accepted for delivery" being conflated with "sent" (the UI language was corrected to say "accepted for delivery" specifically). Event-reminder emails are not yet built (no event-reminder send path exists — `ensureSundayServiceEvents` queues an `event_reminder` job type but nothing consumes that job type yet in `executeJob`). 🚫 No real Resend account exercised.

## TEST 7 — AI Studio

**Expected:** Real generation via AgentRouter/DeepSeek/OpenAI/Gemini/Anthropic where configured; clear "unavailable" if a key is absent; no silent fake success.

**Result:** ✅ VERIFIED (static) for the failure-honesty fix — `usedTemplateFallback`/`providerError` are now returned and surfaced as a warning toast instead of a false success message (readiness report §8). AgentRouter test-connection bugs (model namespacing, double `/v1`) are fixed by code inspection. 🚫 No real API key for any provider (AgentRouter, DeepSeek, OpenAI, Gemini, Anthropic) was available to run an actual generation.

## TEST 8 — AgentRouter

**Expected:** Save → Test Connection → Model Discovery → Generate, independently verified, with truthful diagnostics (not just "failed") and no key leakage.

**Result:** ✅ VERIFIED (static). Root-cause bugs fixed (see readiness report §8); error messages already parse and surface the real upstream message rather than a generic failure (this was already correct in the pre-existing code, per the original audit). Save/GET responses mask secrets (`maskSecret()`, pre-existing and confirmed still correct). 🚫 No real AgentRouter key available to execute Save → Test → Discover → Generate live.

## TEST 9 — Paystack

**Expected:** Correct architecture (initialize → webhook → signature verify → idempotent activation), tested in Paystack test mode before production keys are used.

**Result:** ✅ VERIFIED (static) for architecture — this was the single largest gap found and is now built correctly (readiness report §13): signature verification, transactional idempotency claim, server-to-server re-verification, plan activation only from the webhook, Firestore rule blocking client-side plan writes. 🚫 **NOT EXECUTED with a real Paystack test-mode key** — no successful-payment, failed-payment, or duplicate-webhook-delivery test was actually run. **This is a BLOCKER for launch per the readiness report — do not switch to live Paystack keys until this test plan's Paystack section is re-run for real.**

## TEST 10 — Prayer Request

**Expected:** Public form → correct tenant → Firestore record → admin notification (in-app + email) → dashboard visibility → status lifecycle, no manual re-entry.

**Result:** ✅ VERIFIED (static). Fixed the notification-path bug (was writing to a top-level `notifications` collection nothing reads; now writes to `churches/{churchId}/notifications`, which the bell actually queries) and added basic rate limiting/validation to `/api/public/submit`. Church identification via slug lookup, tenant tagging, and admin-page consumption of the same collection were confirmed correct by code trace. 🚫 Not executed against a live deployed church slug.

## TEST 11 — Testimony

**Expected:** Correct church, record creation, moderation/status, notification, admin visibility.

**Result:** ✅ VERIFIED (static). Fixed the field-name mismatch (public API wrote `personName`, admin UI read `authorName` — every public testimony rendered "By undefined"; now both use `authorName`). Added a real Approve action (previously the "Approved" badge was hardcoded regardless of actual status) and a notification on submission (previously testimonies generated no admin notification at all). 🚫 Not executed live.

## TEST 12 — Partnership

**Expected:** Record, church association, notification, dashboard visibility.

**Result:** ✅ VERIFIED (static). **Built from scratch** — no public partnership submission pipeline existed before this pass (admin-entry only). Added `[churchSlug]/partnership` public page, a `partnership` formType in `/api/public/submit`, an admin "Activate" action for pending public submissions, and a notification on submission. 🚫 Not executed live.

## TEST 13 — Donation

**Expected:** Payment initiation → provider → server verification/webhook → completed record only on real confirmation.

**Result:** ✅ VERIFIED (static), with an important scope note: the *donation* flow (`[churchSlug]/donate`) remains informational-only by design (no payment collection on that page — it displays bank details / hosted payment links). The real payment/webhook work in this pass was for **subscription plan upgrades** (`/api/payments/paystack/initialize` + `/api/webhooks/paystack`), which is the flow the original audit found fabricating success client-side. The donate page's own bug (reading a Firestore field, `church.settings.bankAccount`, that nothing ever wrote, so it always showed a fake dummy GTBank account) is fixed — it now reads the real `church.giving.*` fields the Settings page actually saves, and shows an honest "not configured yet" message if the church hasn't set anything up, instead of fabricated bank details. 🚫 Not executed live.

## TEST 14 — Automation

**Expected:** Automatic mode dispatches for real; Manual/Approval mode queues a draft for human approval; no duplicate execution.

**Result:** ⚠️ PARTIAL / ❌ for the Automation page specifically. The Firebase Functions job queue (`processJobQueue`/`executeJob`) now really dispatches `send_whatsapp`/`send_email`/`send_sms` via `CommunicationRouter` instead of a stub — verified by code review and `tsc` build. **However, the `(platform)/automation` page's own "Run Now" and "Approve & Send" buttons were not rewired in this pass** — they still write fabricated activity-log/communications records claiming success without actually dispatching anything. This is explicitly flagged as a HIGH-severity remaining gap in the readiness report. 🚫 Nothing in this area was executed live regardless.

## TEST 15 — Sunday Service Automation

**Expected:** Scenario A (no event) → system creates one at a configured default time. Scenario B (Church Admin already created one) → no duplicate. Scenario C (job runs twice) → still one event.

**Result:** ✅ VERIFIED (static) for all three scenarios by code trace of the new `ensureSundayServiceEvents` scheduled function:
- Scenario A: no existing event titled with "Sunday"+"service" for the upcoming Sunday → creates one using `system/featureFlags.defaultSundayServiceTime` (configurable, default `09:00`).
- Scenario B: any existing event matching that title pattern on that date → skipped, no duplicate.
- Scenario C: a second run on the same date either finds the event from Scenario A/B (title match) or hits the deterministic `sunday-service-<date>` document ID, which already exists → no-op either way.
- Also confirmed: churches in Manual/Approval mode (`preferences.growthMode === 'manual'` or `settings.aiMode === 'approval'`) are skipped entirely, so a Church Admin's own event-creation workflow is never overridden.
🚫 Not executed against a live Firebase Functions deployment/scheduler — this is a `tsc`-verified, logically-traced implementation, not a live-fired cron run.

## TEST 16 — Daily 6:00 AM Report

**Expected:** Real members/visitors/follow-up/prayer/testimony/giving/events/growth-objectives/AI-insights data; delivery to In-App/Email/WhatsApp; CTA links open correct authenticated pages.

**Result:** ✅ VERIFIED (static), with fixes: new-member/new-visitor counts are now real 7-day deltas (previously fabricated as fixed percentages of the total); giving total is now a real sum from the `donations` subcollection (previously hardcoded to 0); an upcoming-events section and growth-objectives context were added to both the AI prompt and the saved report; the notification-path bug (top-level vs. subcollection) was fixed here too; the email CTA now uses the real deployed app URL (previously hardcoded to a domain, `church-growth-os.vercel.app`, that didn't even match the actual fallback URL used elsewhere in the code, `church-growth-os-web.vercel.app`) and deep-links to the top 3 recommended actions plus a dedicated "Do you have an upcoming event? → Schedule an Event" CTA when no events are scheduled. WhatsApp delivery was added as a third, isolated-failure channel. **Important scope note**: the on-demand report route (`lib/server/daily-report.ts`, used by the "Trigger Now" button) and the cron-driven `functions/src/scheduled/dailyReport.ts::generateDailyExecutiveReport` remain **two separate implementations** — only the on-demand one received these fixes in this pass, because it's the one both routes actually share logic-wise for delivery; the cron path's own metric computation was not independently re-verified against these same fixes. 🚫 Not executed live.

## TEST 17 — Multi-Channel Campaign

**Expected:** Email-only, WhatsApp-only, SMS-only, WhatsApp+Email, WhatsApp+Email+SMS all work; unavailable channels don't block available ones; per-channel status shown.

**Result:** ✅ VERIFIED (static). The Communications compose UI now supports arbitrary multi-select (not restricted to only the 5 named combinations — any subset of the three channels), backed by `/api/communications/broadcast`'s per-channel isolation (`Promise.all` over channels, each independently wrapped in try/catch, one channel's `skipped`/`error` never affects another's `sent`/`failed` counts). 🚫 Not executed with real provider credentials.

## TEST 18 — Support

**Expected:** Full two-way ticket conversation with notification/email on both sides, correct lifecycle, close semantics.

**Result:** ✅ VERIFIED (static) — this was a confirmed, reproducible bug (two unlinked Firestore documents) and is now fixed with a single canonical collection, real-time updates, a reply UI on both sides (previously absent on the Church Admin side entirely), and correct notification field/type/routing. 🚫 Not executed against a live deployment — the fix was verified by tracing the exact read/write paths on both the Church Admin and Super Admin sides and confirming they now target the same document.

## TEST 19 — Feature Flags

**Expected:** Disabling a feature hides the sidebar, blocks direct URL access, blocks the API, blocks automation/AI — independently testable for global flag, plan feature, and role permission.

**Result:** ⚠️ PARTIAL — this is the most significant remaining gap alongside Paystack. `resolveFeatureAccess()` (the single composed Global-Flag-AND-Plan-AND-Role function the spec calls for) is built and correctly composes all three inputs — verified by code review of its logic and the two routes it's wired into (`/api/ai/generate`, `/api/communications/broadcast`). **It is not yet applied to most other gated modules** (Store, Live Service, Giving, and others still write directly via the client Firestore SDK with no feature/plan/role check beyond basic tenant membership), and the Sidebar/MobileNav still render every nav item unconditionally regardless of flag/plan/role state. Disabling a flag today will correctly block AI generation and communications broadcasts at the API layer; it will **not** currently hide those other modules' sidebar entries or block their direct-URL/direct-Firestore access. 🚫 Not executed against a live deployment.

## TEST 20 — Tenant Isolation

**Expected:** Church B cannot access Church A's data via UI or direct API, across every module.

**Result:** ⚠️ PARTIAL. Firestore rules (`isChurchMember`/`isChurchOwnerOrAdmin`) provide the core isolation and were reviewed and are logically sound (pre-existing, not restructured, but the `system/*` leak and the several unauthenticated-API-route IDOR paths this pass fixed were real cross-tenant/cross-privilege holes — see readiness report §3/§5). **No live two-tenant IDOR probing was executed** — creating two real churches and attempting cross-tenant reads/writes via both UI and raw API calls (as the task's Test 20 describes) requires a live deployment this environment doesn't have. 🚫 NOT EXECUTABLE here.

## TEST 21 — Super Admin

**Expected:** Full platform management capability without secret exposure to the browser.

**Result:** ✅ VERIFIED (static). Confirmed no API response anywhere returns an unmasked secret (all provider-credential GET routes use `maskSecret()`, pre-existing and re-verified). Confirmed the Super Admin console's own API calls now correctly authenticate (previously worked purely by accident because `verifySuperAdmin` accepted everyone — now genuinely gated, and all ~30 call sites across 15 admin pages were updated to send a real token so the console doesn't break). 🚫 Not executed against a live Super Admin login.

## TEST 22 — Pricing Single Source of Truth

**Expected:** A Super Admin pricing change propagates to Church Admin pricing, the landing page, and subscription enforcement.

**Result:** ⚠️ PARTIAL / pre-existing gap, not addressed in this pass. The audit found that `/admin/pricing-plans` writes to `system/pricing`, which the landing page and Church Admin pricing page both read for **display** (marketing copy, price) — that part is a real single source of truth. But the boolean feature matrix that actually drives enforcement (`PLAN_FEATURE_MATRIX` in `lib/config/pricing-matrix.ts`) is a **hardcoded client-bundle constant**, not read from the live `system/pricing` document, so editing a plan's `featureMap` in the admin console changes what's *displayed* but not what's *enforced*. This was not fixed in this pass (it would require either moving the matrix to Firestore-driven server resolution everywhere `resolveFeatureAccess` is called, which it partially already does via `getChurchFeatureMatrix`'s live `system/pricing` read — but only for the two routes now wired to `resolveFeatureAccess`). 🚫 Not executed live.

## TEST 23 — Failure Testing

**Expected:** Graceful degradation when AI/Email/WhatsApp/SMS/Payment/Cloudinary providers fail — no white screen, no infinite loading, no fake success, no data corruption, no duplicates.

**Result:** ✅ VERIFIED (static) for the paths rebuilt in this pass: AI generation falls back to a clearly-labeled template (no more fake success); Communications broadcast isolates failures per channel; the Paystack webhook is idempotent by construction (transactional claim) so a provider retry cannot double-credit; email failures are caught and don't block ticket/report Firestore writes (pre-existing pattern, preserved). **Not independently stress-tested** by actually killing a provider connection mid-request in a live environment — verified by code inspection of try/catch/isolation boundaries, not by fault injection.

## TEST 24 — Scale / Fan-Out Test Design

**Expected:** Document current fan-out architecture and where it will not hold at scale, rather than faking a 5M-user test.

**Result:** ✅ DONE — see readiness report §15 (Scalability Assessment) and §19 items 10–11/17. Summary: current Announcements and Communications fan-out are synchronous per-request `Promise.all` loops, adequate for realistic near-term scale (tens–hundreds of churches, hundreds of recipients per broadcast) but explicitly documented as needing a real queue (Cloud Tasks, or extending the existing `scheduledJobs`/`processJobQueue` pattern to per-recipient granularity) before genuine high-fan-out scenarios. No infrastructure evolution was attempted in this pass beyond documenting the requirement.

---

## Summary

| Status | Count |
|---|---|
| ✅ VERIFIED (static) | 14 |
| ⚠️ PARTIAL | 6 |
| ❌ NOT IMPLEMENTED / NOT IN SCOPE | 2 |
| Explicitly flagged as requiring a live environment this session didn't have | All 24 |

**No test in this document reached VERIFIED (live) status.** Every fix described is real, code-reviewed, and passes the automated `type-check`/`lint`/`build` gate — but this repository has zero automated tests and this session had no live Firebase project or provider credentials. Treat this document as a specific, itemized checklist for whoever next has access to a staging deployment with real (test-mode) credentials, not as evidence the system has been proven correct in production conditions.
