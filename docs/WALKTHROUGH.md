# Church Growth OS — System Architecture & Production Engineering Walkthrough

> **Document Version:** 1.0 (Final UI/UX & Architecture Pass)  
> **Audience:** Claude Code in VS Code & Core Engineering Team  
> **Repository:** `iziwizi/Church-Growth-OS`  
> **Status:** Landing Page UI/UX Frozen • Ready for Backend, Security & Production Hardening

---

## 1. Executive Summary & Repository Structure

Church Growth OS is an enterprise-grade, multi-tenant software-as-a-service platform built for Christian ministries, senior pastors, and church administrative teams.

```
Church Growth OS/
├── apps/
│   └── web/
│       ├── public/                   # Static assets (logo.png, hero-church-bg.jpg, icons)
│       └── src/
│           ├── app/
│           │   ├── (auth)/           # /login, /register, /forgot-password, /verify-email
│           │   ├── (platform)/       # Core SaaS tenant portal (dashboard, members, visitors, etc.)
│           │   ├── (admin)/          # Super Admin console (/admin/*)
│           │   ├── [churchSlug]/     # Public church portals (giving, visitors, prayers, store)
│           │   ├── api/              # Next.js route handlers (admin, auth, comms, ai, upload)
│           │   └── page.tsx          # Public SaaS marketing landing page
│           ├── components/
│           │   ├── landing/          # Modular landing page sections
│           │   ├── layout/           # Sidebar, Navbar, UserProfileDropdown, Breadcrumbs
│           │   └── dashboard/        # Operational widgets, charts, and metric cards
│           ├── lib/                  # Firebase client/admin, AI router, email/SMS helpers
│           └── store/                # Zustand client state (auth, tenant, theme)
└── docs/
    ├── CHURCH_GROWTH_OS_ENGINEERING_HANDOFF.md  # Comprehensive operational handoff guide
    └── WALKTHROUGH.md                           # This document
```

---

## 2. Public Marketing Landing Page Architecture

The landing page (`apps/web/src/app/page.tsx`) is composed of 13 modular, responsive components adhering to a light SaaS aesthetic:

1. **`LandingNavbar` (`components/landing/Navbar.tsx`):** Responsive brand navigation, mobile drawer with backdrop blur, smooth scroll shadow transitions, and auth entry points.
2. **`LandingHero` (`components/landing/Hero.tsx`):**
   - **Aesthetic:** Light technology/ministry atmosphere with warm neutral tones, subtle radial indigo gradients, and technical grid texture.
   - **Layer 4 Network Visual (`NetworkGraph.tsx`):** Abstract curved bezier connection paths and gentle pulsing nodes symbolizing *People → Communication → Intelligence → Growth*.
   - **Command Center Dashboard:** High-contrast light card container featuring the centered 🔴 **LIVE Service Broadcast Bar** (`Grace City Cathedral • 482 Global Viewers • 1080p 60fps HD Active`), audio equalizer waveform, and tabbed operational views (*Ministry Overview*, *Approval Queue*, *Growth Intelligence*).
3. **`TrustValueStrip` (`components/landing/TrustValueStrip.tsx`):** Trust badges and metrics ribbon.
4. **`ProblemSolution` (`components/landing/ProblemSolution.tsx`):** Comparative breakdown: Fragmented Tools vs Unified Intelligent Ministry Platform.
5. **`CoreFeatures` (`components/landing/CoreFeatures.tsx`):** 6 key pillars (Member CRM, Visitor Follow-Up, Unified Messaging, Digital Giving, Sermon Repurposing, Executive Intelligence).
6. **`AiAutomationSection` (`components/landing/AiAutomationSection.tsx`):**
   - **Mode 1 (Autonomous Mode - Default):** Continuous self-running demonstration cycling through visitor trigger detection, automated AI drafting, auto-approval, and sequential 3-channel dispatch (WhatsApp, Email, SMS).
   - **Mode 2 (Human Approval Mode):** Continuous demonstration featuring a simulated cursor navigating to `[Edit Copy]` (revealing personalization draft) and clicking `[Approve & Send]` before multi-channel broadcast.
   - **Simulation Safety:** 100% frontend local simulation; zero real API calls; clearly labeled with `"Live Demo Simulation"`.
7. **`CommunicationsShowcase` (`components/landing/CommunicationsShowcase.tsx`):** 2-column interactive channel selector (WhatsApp Meta Cloud, Resend Email, Termii SMS, In-App Alerts) with live message previews.
8. **`MinistryGrowthOS` (`components/landing/MinistryGrowthOS.tsx`):** 6:00 AM Daily Briefing, discipleship goal tracking, and automated sermon clip generator.
9. **`AutomationWorkflow` (`components/landing/AutomationWorkflow.tsx`):** 5-step visual pipeline (Capture → Analyze → Approve → Dispatch → Retain).
10. **`PastorsSection` (`components/landing/PastorsSection.tsx`):** Pastoral voice and leadership governance narrative.
11. **`SecurityControlSection` (`components/landing/SecurityControlSection.tsx`):** Multi-tenant data isolation, role-based access control, and GDPR/NDPR compliance.
12. **`PricingSection` (`components/landing/PricingSection.tsx`):** Dynamic pricing cards pulling directly from canonical Super Admin pricing configuration via `pricingService.getPublicPlans()`, supporting dual-currency (NGN ₦ / USD $) and monthly/annual billing toggles.
13. **`FaqSection` & `FinalCta` & `Footer`:** Expandable FAQ accordion, final conversion CTA, and footer attributing product ownership to **MUJTEKNIFY LIMITED**.

---

## 3. Platform Architecture & Core Routes

### A. Tenant SaaS Routes (`/app/(platform)/*`)
- `/dashboard`: Real-time operational command center, attendance charts, quick actions, and executive briefing widget.
- `/members`: Congregation roster, custom roles (Leader, Worker, Deacon, Elder, Custom), tag filtering, profile details.
- `/visitors`: First-time guest tracking, multi-day discipleship journey pipelines, and worker follow-up assignments.
- `/communications`: Broadcast composer for WhatsApp, Email, and SMS with recipient filtering.
- `/live-service`: Streaming pre-flight checklist, viewer counter, and multi-cast status.
- `/sermons`: Media upload, sermon transcript library, AI bullet generation.
- `/events`: Church calendar, registration management, and automated reminders.
- `/giving`: Online giving records, tithes/offerings tracking, and bank reconciliation.
- `/donations`: Special financial campaigns and pledge progress meters.
- `/partnerships`: Ministry partner tiers and recurring pledge monitoring.
- `/testimonies`: Congregation testimony moderation and approval queue.
- `/prayer-requests`: Intercessory prayer queue with confidentiality levels.
- `/store`: Ministry e-commerce catalog, books, media assets, and digital downloads.
- `/reports`: 6:00 AM Executive Daily Briefings and retention analytics.
- `/settings`: Profile, branding, users & permissions, social integrations, notifications, branches, subscription plan, giving accounts, and security.

### B. Super Admin Console (`/app/(admin)/admin/*`)
- `/admin`: Global MRR, active church count, member count, and platform telemetry.
- `/admin/churches`: Church tenant management, plan override, and status toggle.
- `/admin/pricing-plans`: Canonical tier editor (Starter, Growth, Kingdom) synced to the public landing page.
- `/admin/ai-providers`: AgentRouter, OpenAI, OpenRouter, DeepSeek, and Gemini credentials & connection tests.
- `/admin/email-providers`: Resend API keys, webhook status, and test email sender.
- `/admin/whatsapp`: Meta Cloud API credentials, Phone Number ID, and test message runner.
- `/admin/cloudinary`: Cloudinary credentials and storage health tests.
- `/admin/feature-flags`: Global feature toggles (e.g., `ai_autonomous_mode`, `store_module`).
- `/admin/subscriptions`, `/admin/invoices`, `/admin/payments`: Billing ledger & Paystack transaction tracking.
- `/admin/platform-health`, `/admin/audit-logs`: System health checks and immutable admin audit trails.

### C. Public Church Front-End (`/[churchSlug]/*`)
- `/[churchSlug]`: Public church landing profile.
- `/[churchSlug]/donate`: Online giving checkout (Bank Transfer, Paystack, Flutterwave, PayPal, Stripe).
- `/[churchSlug]/visitor`: Digital first-time guest check-in form.
- `/[churchSlug]/prayer-request`: Congregation prayer submission.
- `/[churchSlug]/testimony`: Public testimony submission.
- `/[churchSlug]/contact`: Ministry contact information.

---

## 4. API Routes Inventory

| Endpoint | Method | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `/api/auth/session` | `POST`, `DELETE` | Set / Clear Firebase session cookies | Public / Firebase Token |
| `/api/auth/test-email` | `POST` | Dispatch verification/test email via Resend | Authenticated Staff |
| `/api/communications/broadcast` | `POST` | Queue multi-channel broadcast | Church Staff |
| `/api/church/daily-report/generate` | `POST` | Generate 6:00 AM executive briefing | Scheduled Cron / Admin |
| `/api/ai/generate` | `POST` | Proxy LLM generation via AgentRouter | Church Staff / Admin |
| `/api/upload` & `/api/upload/delete` | `POST` | Cloudinary file upload / cleanup | Authenticated Staff |
| `/api/admin/ai-providers/test` | `POST` | Validate AgentRouter/OpenAI credentials | Super Admin |
| `/api/admin/email-providers` | `POST`, `GET` | Save & test Resend configuration | Super Admin |
| `/api/admin/whatsapp/send-test` | `POST` | Dispatch test WhatsApp Cloud message | Super Admin |
| `/api/admin/cloudinary/test` | `POST` | Verify Cloudinary storage connection | Super Admin |
| `/api/admin/pricing-plans` | `GET`, `POST` | Read & update canonical pricing plans | Super Admin / Public GET |
| `/api/admin/feature-flags` | `GET`, `POST` | Manage platform feature toggles | Super Admin |

---

## 5. Environment Variables & Credentials Model

All environment variables follow strict server/client separation:

```env
# Firebase Public Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Server Admin SDK (Private)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...

# AI Infrastructure (Server-Side)
AGENTROUTER_API_KEY=...
AGENTROUTER_BASE_URL=https://co.agentrouter.org/v1
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
GEMINI_API_KEY=...

# Communications Infrastructure (Server-Side)
RESEND_API_KEY=...
WHATSAPP_META_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
TERMII_API_KEY=...

# Storage & Media (Server-Side)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payments & Billing (Server-Side)
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...
```

---

## 6. Priorities for Independent Engineering Phase (Claude Code in VS Code)

With the UI/UX completely frozen and verified, Claude Code will focus on backend, security, and scalability tasks:

1. **Security & Authorization Audit:**
   - Verify that all Firestore Security Rules enforce tenant isolation (`resource.data.churchId == request.auth.token.churchId`).
   - Validate Super Admin custom claims on all `/api/admin/*` routes.
2. **Rate Limiting & Abuse Prevention:**
   - Implement Upstash Redis or memory-based rate limiting on public endpoints (`/api/public/submit`, `/[churchSlug]/visitor`, `/[churchSlug]/donate`).
3. **Webhook Verification:**
   - Validate Paystack cryptographic signature (`X-Paystack-Signature` HMAC SHA512) on payment webhooks.
   - Validate Meta WhatsApp webhook challenge verification (`hub.verify_token`).
4. **Queue & Background Jobs:**
   - Harden async background queue processing for large broadcast dispatches (handling pagination, rate limits, and failure retry queues).
5. **End-to-End & Integration Testing:**
   - Add Playwright / Vitest test suites covering user authentication, tenant registration, multi-channel dispatch simulation, and permission boundaries.
