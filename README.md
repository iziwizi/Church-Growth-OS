# Church Growth OS

> AI-Powered Multi-Tenant Church Growth Operating System

[![CI/CD](https://github.com/iziwizi/Church-Growth-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/iziwizi/Church-Growth-OS/actions/workflows/ci.yml)

## 🏛️ Overview

Church Growth OS is a production-grade SaaS platform that helps churches of every size automate engagement, communication, and ministry growth through AI-assisted workflows.

**Automation First** — The AI works automatically. The dashboard shows what the AI has already accomplished, not what it's waiting for.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| State | Zustand, TanStack Query |
| Backend | Firebase Auth, Firestore, Cloud Functions |
| AI | Claude (default), OpenAI, DeepSeek |
| Communication | Meta Cloud API, UltraMsg, Resend, Termii, Africa's Talking |
| Media | Cloudinary |
| Charts | Recharts |
| Animation | Framer Motion |
| Deployment | Vercel + Firebase |
| Monorepo | Turborepo + pnpm |

## 📁 Project Structure

```
church-growth-os/
├── apps/
│   └── web/              # Next.js 15 application
├── packages/
│   ├── shared/           # Types, validators, errors
│   ├── communication/    # Provider adapter layer
│   ├── ai/               # AI router + providers
│   └── automation/       # Workflow engine
├── functions/            # Firebase Cloud Functions
└── firestore/            # Security rules + indexes
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Firebase CLI: `npm i -g firebase-tools`

### Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
# Fill in your Firebase, AI, and Cloudinary credentials
```

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

See the full [Architecture Blueprint](./docs/ARCHITECTURE.md) for:
- Multi-tenant strategy
- Communication provider adapter pattern
- AI orchestration layer
- Automation engine design
- Firestore security rules
- 5-phase roadmap

## 🔐 Environment Variables Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config |
| `FIREBASE_ADMIN_*` | Firebase Admin SDK (server-only) |
| `ANTHROPIC_API_KEY` | Claude AI key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |

## 📱 Modules

| Module | Status |
|---|---|
| Dashboard | ✅ Foundation |
| Members | 🏗️ Stage 3 |
| Visitors | 🏗️ Stage 3 |
| Communications | 🏗️ Stage 4 |
| AI Studio | 🏗️ Stage 5 |
| Automation | 🏗️ Stage 6 |
| Donations | 🏗️ Stage 7 |
| Reports | 🏗️ Stage 8 |

## 🤝 Contributing

This is a private repository. Development follows the phased blueprint in `docs/ARCHITECTURE.md`.

## 📄 License

Private — Church Growth OS © 2026
