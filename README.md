# 🏛️ Marble Mart CRM

**Enterprise-grade Customer Relationship Management for the Marble & Stone Industry**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Performance](#performance)
- [Security](#security)

---

## Overview

Marble Mart CRM is a full-stack, production-grade management platform purpose-built for marble and stone dealers. It replaces spreadsheets and manual tracking with a modern SaaS interface — real-time inventory, drag-and-drop pipeline, AI-powered assistance, PDF quotations, and actionable analytics.

**Key Metrics:**
- 35+ npm dependencies, 200+ source files
- 14 REST API endpoint groups
- 10 dashboard modules
- Real-time Supabase backend with Row Level Security

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 + CSS Variables |
| **UI Components** | Radix UI (20+ primitives) |
| **State** | React Query (TanStack) + Zustand |
| **Forms** | Native HTML5 validation |
| **Charts** | Recharts (dynamic import) |
| **Maps** | Leaflet + React-Leaflet (dynamic import) |
| **PDF** | jsPDF + jspdf-autotable (dynamic import) |
| **Drag & Drop** | @dnd-kit |
| **Icons** | Lucide React |
| **Backend** | Supabase (Postgres, Auth, Storage, Edge Functions) |
| **AI** | DeepSeek API |
| **Deploy** | Vercel (Mumbai region) |

---

## Features

### 🔐 Authentication & Authorization
- Email/password login with Supabase Auth
- Role-based access control (Admin / Agent)
- Row Level Security (RLS) on all database tables
- Protected middleware for `/dashboard/*` and `/api/*`
- Server-side session management via `@supabase/ssr`

### 📊 Dashboard
- KPI cards: total leads, pipeline value, conversion rate, active agents
- Low stock & out-of-stock inventory alerts
- Win/loss ratio calculation
- Recent activity feed from `lead_activities`
- Server-side aggregation via `/api/dashboard/stats`

### 👥 Lead Management
- Full CRUD: create, read, update, delete leads
- Status workflow: New → Contacted → Negotiation → Quotation Sent → Converted / Lost
- Lead assignment to agents
- Deal value tracking
- Search & filter by status, marble type, location
- API: `GET/POST/PATCH/DELETE /api/leads`

### 📋 Pipeline (Kanban Board)
- Drag-and-drop Kanban columns by status
- Visual lead cards with marble type, value, agent
- Real-time column totals
- Optimistic UI updates via React Query mutations
- API: `GET/PATCH /api/pipeline`

### 🗿 Marble Catalog
- 12 premium marble types with full specs
- Real marble photos from Supabase Storage (121 images)
- Filter by color, grade (Economy → Luxury), category
- Grade badges with color coding
- Thickness, finish, vein pattern details
- Image gallery with lightbox
- Photo upload to Supabase Storage
- API: `GET/POST/DELETE /api/marbles/images`

### 📦 Inventory Management
- Complete stock tracking with 20+ fields
- Real-time quantity, unit price, warehouse location
- Low stock alerts (quantity ≤ min stock level)
- Status: In Stock / Low Stock / Out of Stock / Discontinued
- Inventory value aggregation
- Stock movements history
- API: `GET/POST/PATCH/DELETE /api/inventory`

### 📄 Quotations
- Generate professional PDF quotations
- Dynamic import of jsPDF (zero bundle cost until used)
- Marble pricing calculator with finish multipliers
- Client details, line items, totals
- Status workflow: Draft → Sent → Accepted → Rejected
- API: `GET/POST /api/quotations`

### 📈 Analytics
- Time-series charts (Recharts)
- Revenue trends, lead conversion funnel
- Agent performance metrics
- Marble type popularity
- Period filters: 1M, 3M, 6M, 1Y
- API: `GET /api/analytics`

### 🤖 AI Assistant
- DeepSeek-powered chat interface
- Context-aware responses for marble industry
- Lead insights, inventory suggestions
- API: `POST /api/ai`

### 🗺️ Field Operations
- Interactive map (Leaflet) of agent locations
- Agent tracking with real-time positions
- Site visit scheduling
- API: `GET/POST /api/locations`, `/api/site-visits`

### ⚙️ Settings
- User profile management
- Role assignment (Admin/Agent)
- System configuration
- Audit log viewer

### 🎨 UI/UX
- Premium SaaS design (Stripe/Linear-inspired)
- Split-screen auth layout with marble branding
- Glassmorphism cards with backdrop blur
- Password visibility toggle + strength meter
- Remember me + forgot password
- Loading skeletons, error states, empty states
- Responsive: mobile-first, touch-friendly
- Dark mode support via CSS variables
- Custom animations (fade-in, slide-in, scale-in)
- Command palette (`⌘K`) for quick navigation

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Vercel                      │
│  ┌───────────────────────────────────────┐  │
│  │         Next.js 15 (App Router)       │  │
│  │  ┌─────────┐  ┌───────────────────┐  │  │
│  │  │ Client   │  │  Server Components │  │  │
│  │  │ Components│  │  & API Routes      │  │  │
│  │  └────┬─────┘  └────────┬──────────┘  │  │
│  │       │                 │              │  │
│  │  React Query      Supabase SSR Client  │  │
│  │  (TanStack)       (Server-side auth)   │  │
│  └───────┼─────────────────┼──────────────┘  │
└──────────┼─────────────────┼─────────────────┘
           │                 │
    ┌──────┴──────┐   ┌──────┴──────┐
    │  Supabase    │   │  DeepSeek   │
    │  • Postgres  │   │  AI API     │
    │  • Auth      │   └─────────────┘
    │  • Storage   │
    │  • RLS       │
    └─────────────┘
```

**Data Flow:**
1. Client components use React Query hooks (`use-queries.ts`)
2. React Query calls Next.js API routes (`/api/*`)
3. API routes use Supabase server client (`createClient()`)
4. Supabase enforces RLS policies at the database level
5. Mutations invalidate related query caches for instant UI sync

---

## Project Structure

```
webui/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login & Signup pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   │   ├── analytics/   # Charts & metrics
│   │   │   │   ├── field-ops/   # Agent map tracking
│   │   │   │   ├── inventory/   # Stock management
│   │   │   │   ├── marble-catalog/ # Product gallery
│   │   │   │   ├── pipeline/    # Kanban board
│   │   │   │   ├── quotations/  # PDF generation
│   │   │   │   ├── reports/     # Business reports
│   │   │   │   └── settings/    # Admin settings
│   │   │   ├── layout.tsx       # Dashboard shell
│   │   │   └── page.tsx         # Dashboard home
│   │   ├── api/                 # 20+ API route handlers
│   │   │   ├── agents/
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── audit/
│   │   │   ├── dashboard/stats/
│   │   │   ├── inventory/
│   │   │   ├── leads/
│   │   │   ├── locations/
│   │   │   ├── marbles/images/
│   │   │   ├── pipeline/
│   │   │   ├── quotations/
│   │   │   └── workflow/
│   │   ├── layout.tsx           # Root layout + CSP headers
│   │   └── globals.css          # Tailwind + CSS variables
│   ├── components/
│   │   ├── ai/                  # AI chat assistant
│   │   ├── auth/                # AuthShell (marble-themed)
│   │   ├── crm/views/           # Leads, Agents, Locations views
│   │   ├── dashboard/           # Dashboard KPI widgets
│   │   ├── layout/              # CommandPalette, DashboardShell
│   │   ├── pipeline/            # KanbanBoard, PipelineCard
│   │   ├── quotations/          # MarblePricingCalculator
│   │   └── ui/                  # shadcn/ui primitives (20+)
│   ├── config/
│   │   ├── marbles.ts           # 12 marble types with specs
│   │   └── permissions.ts       # RBAC configuration
│   ├── hooks/
│   │   └── use-queries.ts       # Centralized React Query hooks
│   ├── lib/
│   │   ├── ai/deepseek.ts       # DeepSeek API client
│   │   ├── supabase/            # Client, Server, Middleware, Admin
│   │   ├── react-query/         # QueryClient provider
│   │   └── utils.ts             # formatCurrency, helpers
│   ├── stores/                  # Zustand state stores
│   │   ├── auth-store.ts
│   │   ├── lead-store.ts
│   │   ├── pipeline-store.ts
│   │   └── ui-store.ts
│   └── types/
│       ├── crm.ts               # TypeScript interfaces
│       └── database.ts          # Supabase-generated types
├── public/                      # Static assets
│   └── marbles/                 # SVG fallback images
├── supabase/
│   ├── migration-phase-2.sql    # Schema + seed data
│   ├── migration-phase-3-rls.sql # RLS policies
│   ├── mega-seed.sql            # 100+ leads, 20 inventory items
│   └── functions/workflow/      # Edge Functions
├── next.config.ts               # CSP, remotePatterns, headers
├── vercel.json                  # Vercel deployment config
├── tailwind.config.js           # Tailwind + custom animations
├── tsconfig.json                # TypeScript config
├── .gitignore                   # Production-safe exclusions
└── package.json                 # 35+ dependencies
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project ([create one](https://supabase.com))
- **DeepSeek** API key ([get one](https://platform.deepseek.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/marble-mart-crm.git
cd marble-mart-crm/webui

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Database (for CLI migrations)
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:5432/postgres

# AI
DEEPSEEK_API_KEY=sk-...
```

### Database Setup

```bash
# Run schema migration
npm run db:migrate

# Seed sample data (100 leads, 20 inventory items, 15 agents)
npm run db:seed
```

### Development

```bash
npm run dev
# → http://localhost:3000

# Type checking
npm run type-check

# Linting
npm run lint
```

### Build

```bash
npm run build
npm start
```

---

## API Reference

All endpoints are prefixed with `/api`. Responses are JSON.

### Authentication required for all `/api/*` and `/dashboard/*` routes (via middleware).

| Endpoint | Method | Description |
|---|---|---|
| `/api/leads` | GET | List all leads |
| `/api/leads` | POST | Create lead |
| `/api/leads/[id]` | PATCH | Update lead |
| `/api/leads/[id]` | DELETE | Delete lead |
| `/api/agents` | GET | List agents |
| `/api/agents` | POST | Create agent |
| `/api/pipeline` | GET | Get Kanban board data |
| `/api/pipeline` | PATCH | Move lead between columns |
| `/api/inventory` | GET | List inventory (`?lowStock=true`, `?status=`) |
| `/api/inventory` | POST | Add inventory item |
| `/api/inventory` | PATCH | Update inventory item |
| `/api/inventory` | DELETE | Delete inventory item |
| `/api/locations` | GET/POST | Agent location tracking |
| `/api/quotations` | GET/POST | Quotation management |
| `/api/dashboard/stats` | GET | Aggregated KPIs |
| `/api/analytics` | GET | Time-series data (`?period=6m`) |
| `/api/marbles/images` | GET | List images (`?marbleId=`) |
| `/api/marbles/images` | POST | Upload image (multipart) |
| `/api/ai` | POST | DeepSeek chat completion |
| `/api/workflow` | GET | Workflow automation rules |

**Response format:**
```json
{
  "items": [{ "id": "uuid", "name": "...", ... }]
}
```

**Caching:** List endpoints use `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.

---

## Authentication

- **Supabase Auth** with email/password
- Server-side session via `@supabase/ssr` + cookie-based auth
- Middleware (`src/middleware.ts`) protects `/dashboard/*` and `/api/*`
- Row Level Security (RLS) enforced on all database tables
- Roles: `admin` (full access), `agent` (limited)
- Auth UI: split-screen premium design with marble branding

---

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import in Vercel → Set Root Directory: webui

# 3. Add Environment Variables (see .env.local above)

# 4. Deploy
```

**Region:** Mumbai (`bom1`) — configured in `vercel.json`

**Build settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install --legacy-peer-deps`

### Post-Deploy

Update Supabase Auth redirect URLs:
```
https://your-app.vercel.app/**
```

---

## Performance

| Optimization | Implementation |
|---|---|
| **Dynamic imports** | Recharts, Leaflet, jsPDF loaded on demand |
| **React Query caching** | `staleTime: 60s`, `gcTime: 5min` |
| **API caching** | `Cache-Control: s-maxage=30, stale-while-revalidate=60` |
| **Bundle optimization** | `optimizePackageImports` for lucide-react, radix-ui |
| **Compression** | Gzip/Brotli via `compress: true` |
| **Image optimization** | AVIF/WebP formats, remote CDN patterns |
| **Lazy loading** | `loading="lazy"` on images, skeleton states |

---

## Security

| Measure | Location |
|---|---|
| **CSP Headers** | `next.config.ts` — strict content security policy |
| **CORS** | `Access-Control-Allow-Origin` restricted |
| **Row Level Security** | All Supabase tables — `USING` policies |
| **SQL Injection** | Parameterized queries via Supabase SDK |
| **XSS** | React auto-escaping + CSP `script-src 'self'` |
| **HTTPS** | Enforced via `Strict-Transport-Security` |
| **Secrets** | `.env*` in `.gitignore`, Vercel env vars |
| **Rate Limiting** | Vercel + Supabase built-in |

---

## License

Private — Marble Mart CRM. All rights reserved.

---

## Support

For issues or questions, contact the development team.

