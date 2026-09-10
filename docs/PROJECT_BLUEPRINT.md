# Full-Stack Project Blueprint & Prompt Sheet

### MERN + TypeScript — Industry Agnostic

> **Version:** 2.2 
> **Document snapshot:** Practices are maintained over time — dependency numbers in this file are **not** authoritative. 
> **Audience:** Solo developers, AI coding assistants (Cursor, Copilot, Claude), team developers, non-technical stakeholders 
> **Purpose:** Copy-paste prompts, security checklists, folder structure, and API documentation standards for any full-stack project — not tied to any specific industry.

---

## ⚠️ Version Safety Rule (Read First)

> **Never copy version numbers from this document (or from memory) into `package.json`.** Old pins stay vulnerable; docs go stale the day they ship.

### For humans

1. Open [npmjs.com](https://www.npmjs.com/) for each package — confirm **latest** and read the **Security** / advisory links if shown. 
2. Prefer the **newest patched release** on a supported major line — not an old pin “because the tutorial said so.” 
3. After install: `npm audit` and fix **high/critical** before shipping.

```bash
npm show <package-name> version          # latest published
npm view <package-name> time.modified    # how fresh “latest” is
npm audit                                # installed tree
```

### For AI assistants (mandatory)

Before you write or edit **`package.json`**, **`package-lock.json`**, or recommend install commands:

1. **Web search** (use your built-in web search tool when available) for **each** non-trivial dependency, for example: 
  - `"npm <package-name> latest version"` 
  - `"<package-name> npm security advisory"` or `"<package-name> CVE"` 
  For **Node.js**, search e.g. `"Node.js LTS current release"` and align with **Active LTS**, not EOL versions. 
2. Cross-check with **`npm show <package> version`** in the terminal when the environment allows — search can lag; npm registry is ground truth for the semver string. 
3. If search turns up an **unpatched CVE** on `latest`, search again for **patched version** or mitigation (or choose an alternative package). 
4. In your reply, **briefly state** what you verified (e.g. “searched + `npm show express version` → using `^5.x.y`”) — do not silently invent versions. 
5. Use **`^`** ranges in `package.json` for application deps unless you have a documented reason to pin an exact version — then pin **to a verified good release**, not an old one.

**No hardcoded version table in this file** — the list below is only **names to verify** (not versions):

| Package (verify each) | What to search / check |
| --------------------- | ---------------------- |
| `express` | Latest stable major line; Express / Node compatibility; advisories |
| `mongoose` | Latest stable; compatibility with your MongoDB driver / Atlas |
| `zod` | Latest stable; note if a new major is in beta — don’t adopt beta for production without intent |
| `jsonwebtoken`, `bcryptjs`, `express-rate-limit`, `helmet`, `cors`, `socket.io` | Same pattern: npm latest + advisory search |

Repeat for **every** dependency you add (including `react`, `vite`, `@sentry/node`, etc.).

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Repository Structure](#2-repository-structure)
3. [Environment Variables](#3-environment-variables)
4. [Backend Architecture](#4-backend-architecture)
5. [API Documentation Standard](#5-api-documentation-standard)
6. [Backend Security Checklist](#6-backend-security-checklist)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Frontend Security Checklist](#8-frontend-security-checklist)
9. [AI Workflow, CI & Git Hygiene](#9-ai-workflow-ci--git-hygiene)
10. [Postman & Testing Guide](#10-postman--testing-guide)
11. [Master Prompts](#11-master-prompts)
12. [Domain Add-On Prompts](#12-domain-add-on-prompts)
13. [Document Maintenance](#13-document-maintenance)

---

## 1. Tech Stack

> Replace `<YOUR_DOMAIN_UI_LIB>` with whatever fits your industry (e.g. FullCalendar for scheduling, Chart.js for analytics, react-map-gl for mapping, etc.)

| Layer                | Choice                        | Versions | Notes                      |
| -------------------- | ----------------------------- | -------- | -------------------------- |
| **Runtime**          | Node.js                       | **Web search** current **Active LTS** — never hardcode an LTS number from docs | Use [nodejs.org](https://nodejs.org/) + search |
| **Framework**        | Express                       | **Search + `npm show`** latest stable | Major lines change — verify |
| **Language**         | TypeScript                    | **Search + `npm show typescript`** | Strict mode enabled        |
| **Database**         | MongoDB Atlas                 | —        | Cloud-hosted               |
| **ODM**              | Mongoose                      | **Search + `npm show`** | Match driver / Atlas docs  |
| **Validation**       | Zod                           | **Search + `npm show`** | Env + request bodies       |
| **Auth**             | Google OAuth + Email/Password | —        | Passport.js strategies     |
| **JWT**              | jsonwebtoken                  | **Search + `npm show` + advisory** | Access + refresh tokens    |
| **Password hashing** | bcryptjs                      | **Search + `npm show`** | Zero native deps           |
| **Security headers** | helmet                        | **Search + `npm show` + advisory** | Tune CSP for your SPA/CDN |
| **CORS**             | cors                          | **Search + `npm show`** | Explicit origin allowlist  |
| **Rate limiting**    | express-rate-limit            | **Search + `npm show`** | Per-route limits           |
| **NoSQL sanitize**   | express-mongo-sanitize        | **Search + `npm show`** | Prevent injection          |
| **Real-time**        | socket.io                     | **Search + `npm show`** | Room-based events          |
| **Job scheduling**   | node-cron                     | **Search + `npm show`** | Background tasks           |
| **Email**            | nodemailer                    | **Search + `npm show`** | SMTP / Resend / SendGrid   |
| **Logging**          | winston                       | **Search + `npm show`** | Structured production logs |
| **Monitoring**       | @sentry/node                 | **Search + `npm show` + Sentry docs** | Error tracking             |
| **Frontend**         | React + Vite                  | **Search + `npm show`** each | SPA                        |
| **Routing**          | react-router-dom              | **Search + `npm show`** | Protected routes           |
| **Server state**     | TanStack Query                | **Search + `npm show`** | Caching + retries          |
| **HTTP client**      | Axios                         | **Search + `npm show`** | Interceptors for refresh   |
| **Forms**            | React Hook Form + Zod         | **Search + `npm show`** each | Validated forms            |
| **HTML sanitize**    | DOMPurify                     | **Search + `npm show` + advisory** | Frontend XSS prevention    |
| **Domain UI**        | `<YOUR_DOMAIN_UI_LIB>`        | —                | Industry-specific          |
| **Deploy: Frontend** | Vercel                        | —                | Set env vars in dashboard  |
| **Deploy: Backend**  | Render / Railway              | —                | Set env vars in dashboard  |
| **Deploy: DB**       | MongoDB Atlas                 | —                | IP allowlist required      |

**Token lifetime standard:**

- Access JWT: `15 minutes` — sent in `Authorization: Bearer` header
- Refresh token: `7 days` — stored in `HttpOnly; Secure; SameSite=Strict` cookie

---

## 2. Repository Structure

```
ProjectRoot/
├── backend/
│   ├── src/
│   │   ├── server.ts                  # Entry: DB connect → cron start → listen
│   │   ├── app.ts                     # Express app: middleware stack + route mounts
│   │   ├── config/
│   │   │   ├── env.ts                 # Zod-validated env — crash on startup if misconfigured
│   │   │   ├── db.ts                  # mongoose.connect + disconnect
│   │   │   └── passport.ts            # Google OAuth strategy (only if env vars present)
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts         # JWT verify → attach req.user
│   │   │   ├── validate.ts            # Zod schema factory → 400 on failure
│   │   │   ├── roleGuard.ts           # Resource-level role enforcement
│   │   │   └── errorHandler.ts        # Central error → standard JSON response
│   │   ├── modules/                   # One folder per domain resource
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts     # Zod schemas for this module
│   │   │   ├── users/
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   └── user.schema.ts
│   │   │   └── <resource>/            # Repeat for each domain resource
│   │   ├── services/
│   │   │   ├── email.service.ts       # Nodemailer wrapper
│   │   │   └── cron.service.ts        # node-cron background jobs
│   │   ├── sockets/
│   │   └── index.ts               # Socket.io auth guard + room setup
│   │   ├── utils/
│   │   │   ├── jwt.ts                 # signAccess, signRefresh, verify
│   │   │   ├── encryption.ts          # AES-256-GCM encrypt/decrypt
│   │   │   ├── ownershipCheck.ts      # Assert resource belongs to req.user
│   │   │   └── tokenCompare.ts        # crypto.timingSafeEqual wrapper
│   │   └── types/
│   │       └── express.d.ts           # Augment Express Request with req.user
│   ├── postman/
│   │   ├── collection.json            # Postman collection (committed)
│   │   └── environment.json           # Postman env template (no real secrets)
│   ├── .env.example                   # Committed template with dummy values
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json                  # Strict mode required
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Route definitions
│   │   ├── lib/
│   │   │   ├── env.ts                 # VITE_* Zod validation
│   │   │   └── api/
│   │   │       ├── client.ts          # Axios base + withCredentials + interceptors
│   │   │       └── refreshClient.ts   # Separate instance for refresh (no loop)
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx       # Context: user, login, logout
│   │   │   └── tokenStore.ts          # In-memory token (never localStorage)
│   │   ├── components/
│   │   │   ├── RequireAuth.tsx        # Route guard
│   │   │   └── ErrorBoundary.tsx      # Catch render errors
│   │   ├── features/                  # Domain modules (one per API resource)
│   │   │   └── <resource>/
│   │   │       ├── api.ts             # TanStack Query hooks
│   │   │       ├── components/
│   │   │       └── types.ts
│   │   └── pages/
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── docs/
   ├── PROJECT_BLUEPRINT.md           # This file
   └── BACKEND_PLANNING.md            # Detailed planning doc
```

**Rules — never break these:**

- Never commit `.env`, `node_modules`, `dist/`, or `build/`
- Always commit `.env.example` with placeholder values and comments
- One source of truth for env validation: `src/config/env.ts` (backend), `src/lib/env.ts` (frontend)
- TypeScript strict mode always on — no `any` unless explicitly typed and commented

### `.gitignore` — dependencies, env files, secrets, and build output

**Commit:** source code, `package.json` / lockfiles, `.env.example`, Postman templates (no real secrets), `README`, and `docs/`.

**Never commit:** real secrets, `node_modules`, or generated bundles.

```gitignore
# Dependencies (never commit — reinstall with npm ci)
node_modules/

# Environment & secrets — NEVER commit (only .env.example is allowed)
.env
.env.*
!.env.example

# Private keys and common secret filenames
*.pem
*.key
id_rsa
id_ed25519
*.p12
*.pfx

# Build output
dist/
build/
out/
*.tsbuildinfo

# Logs & coverage
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage/
.nyc_output/

# OS / editor noise
.DS_Store
Thumbs.db
```

---

## 3. Environment Variables

### Backend `.env.example`

```env
# ── Server ──────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database ─────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/your_db_name
# Production: mongodb+srv://<user>:<pass>@cluster.mongodb.net/your_db

# ── JWT ───────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=replace_with_64_char_hex
JWT_REFRESH_SECRET=replace_with_different_64_char_hex
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Google OAuth (optional — remove if not using) ──────────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# ── Frontend URL ──────────────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173
# Production: https://yourdomain.com

# ── CORS (comma-separated for multiple origins) ────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ── Encryption (for storing sensitive third-party tokens) ────────────
# Generate: openssl rand -hex 32
ENCRYPTION_KEY=replace_with_64_char_hex

# ── Email (Nodemailer) ────────────────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_smtp_api_key
EMAIL_FROM=noreply@yourdomain.com

# ── Push Notifications (optional) ────────────────────────────────────────
# Generate: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@yourdomain.com

# ── Monitoring ────────────────────────────────────────────────────────────
SENTRY_DSN=https://your_sentry_dsn_here
```

### Frontend `.env.example`

```env
# ── API ───────────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000

# ── Push Notifications (public key only) ─────────────────────────────────
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key

# ── Feature Flags (optional) ─────────────────────────────────────────────
VITE_ENABLE_REAL_TIME=true
```

### Env Validation Pattern (Backend)

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
 NODE_ENV: z.enum(['development', 'production', 'test']),
 PORT: z.string().transform(Number).default('5000'),
 MONGODB_URI: z.string().url(),
 JWT_ACCESS_SECRET: z.string().min(32),
 JWT_REFRESH_SECRET: z.string().min(32),
 JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
 JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
 CLIENT_URL: z.string().url(),
 CORS_ORIGINS: z.string(),
 ENCRYPTION_KEY: z.string().length(64),
 GOOGLE_CLIENT_ID: z.string().optional(),
 GOOGLE_CLIENT_SECRET: z.string().optional(),
 SMTP_HOST: z.string().optional(),
 SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
 console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
 process.exit(1);
}

export const env = parsed.data;
```

---

## 4. Backend Architecture

### Middleware Stack Order (app.ts)

```typescript
// src/app.ts
import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// 1. Sentry request handler (must be first)
app.use(Sentry.Handlers.requestHandler());

// 2. Security headers
app.use(helmet());

// 3. CORS — explicit origin list only, never '*' with credentials
app.use(cors({
 origin: env.CORS_ORIGINS.split(','),
 credentials: true,
 methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. NoSQL injection prevention — strips $ and . from req.body/query/params
app.use(mongoSanitize());

// 6. HTTP request logging (dev only)
if (env.NODE_ENV === 'development') app.use(morgan('dev'));

// 7. Global rate limit
const globalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', globalLimiter);

// 8. Strict auth-route rate limit
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, skipSuccessfulRequests: true });
app.use('/api/v1/auth', authLimiter);

// 9. Routes
app.use('/api/v1', router);

// 10. Sentry error handler (before your error handler)
app.use(Sentry.Handlers.errorHandler());

// 11. Central error handler (always last)
app.use(errorHandler);
```

### Standard Error Response Shape

```typescript
// All error responses:
{
 "success": false,
 "error": {
   "code": "ERROR_CODE",
   "message": "Human readable",
   "fields": {
     "email": ["Invalid email address"],
     "password": ["Must be at least 8 characters"]
   }
 }
}

// All success responses:
{
 "success": true,
 "data": { ... }
}

// Paginated success:
{
 "success": true,
 "data": [...],
 "pagination": {
   "total": 100,
   "page": 1,
   "limit": 20,
   "totalPages": 5
 }
}
```

### Ownership Check Helper

```typescript
// src/utils/ownershipCheck.ts
import { Model, Types } from 'mongoose';

export async function assertOwnership<T>(
 ModelClass: Model<T>,
 resourceId: string,
 userId: string
): Promise<T> {
 const doc = await ModelClass.findOne({
   _id: new Types.ObjectId(resourceId),
   userId: new Types.ObjectId(userId)
 });
 if (!doc) {
   const err = new Error('Resource not found') as any;
   err.statusCode = 404;
   err.code = 'NOT_FOUND';
   throw err;
 }
 return doc;
}
```

### Timing-Safe Token Comparison

```typescript
// src/utils/tokenCompare.ts
import crypto from 'crypto';

export function safeCompare(a: string, b: string): boolean {
 if (a.length !== b.length) return false;
 return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
```

---

## 5. API Documentation Standard & Error Codes Master Reference

| HTTP | Code | When to use |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Zod validation failed on body/query/params |
| 400 | `INVALID_REQUEST` | Logically invalid request (e.g. end before start) |
| 400 | `CONFIRM_TEXT_MISMATCH` | Destructive action confirmation text wrong |
| 401 | `UNAUTHORIZED` | No token provided |
| 401 | `TOKEN_EXPIRED` | Access token expired — client should refresh |
| 401 | `TOKEN_INVALID` | Token tampered or wrong secret |
| 401 | `REFRESH_TOKEN_INVALID` | Refresh token not found or already rotated |
| 403 | `FORBIDDEN` | Authenticated but wrong role |
| 403 | `CANNOT_SELF_DEMOTE` | User tried to remove their own admin/owner role |
| 404 | `NOT_FOUND` | Resource not found or doesn't belong to this user |
| 409 | `CONFLICT` | Duplicate resource (unique field already exists) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests in window |
| 500 | `INTERNAL_ERROR` | Unhandled server error — check Sentry |

---

## 6. Backend Security Checklist

- All secrets in `.env` — zero secrets hardcoded in source
- `.env` and all `.env.*` in `.gitignore`
- Env validated with Zod at startup — app crashes on bad config
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are different, each ≥64 chars
- `ENCRYPTION_KEY` is 32 random bytes (64 hex chars) — stored in env only
- Access tokens short-lived (15min), refresh tokens long-lived (7 days)
- Refresh token stored in `HttpOnly; Secure; SameSite=Strict` cookie
- Refresh tokens hashed with bcrypt before storing in DB with rotation + reuse detection
- `crypto.timingSafeEqual()` used for all token comparisons — no `===`
- `helmet()`, `cors()` allowlist, `express-mongo-sanitize()`, rate limits active
- `assertOwnership()` used in every controller — 404 not 403
- Winston structured logging + Sentry with data scrubbing
- `GET /health` (liveness) and `GET /ready` (readiness) implemented

---

## 7. Frontend Architecture

### Axios Client & Token Store

```typescript
// src/lib/api/client.ts
import axios from 'axios';
import { tokenStore } from '../auth/tokenStore';
import { refreshClient } from './refreshClient';

export const client = axios.create({
 baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
 withCredentials: true,
 timeout: 10_000,
});

client.interceptors.request.use((config) => {
 const token = tokenStore.get();
 if (token) config.headers.Authorization = `Bearer ${token}`;
 return config;
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: Function; reject: Function }> = [];

client.interceptors.response.use(
 (res) => res,
 async (error) => {
   const original = error.config;
   if (error.response?.status === 401 &&
       error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
       !original._retry) {
     original._retry = true;
     if (isRefreshing) {
       return new Promise((resolve, reject) => {
         refreshQueue.push({ resolve, reject });
       }).then(token => {
         original.headers.Authorization = `Bearer ${token}`;
         return client(original);
       });
     }
     isRefreshing = true;
     try {
       const { data } = await refreshClient.post('/auth/refresh');
       tokenStore.set(data.data.accessToken);
       refreshQueue.forEach(p => p.resolve(data.data.accessToken));
       refreshQueue = [];
       original.headers.Authorization = `Bearer ${data.data.accessToken}`;
       return client(original);
     } catch {
       refreshQueue.forEach(p => p.reject());
       refreshQueue = [];
       tokenStore.clear();
       window.location.href = '/login';
       return Promise.reject(error);
     } finally {
       isRefreshing = false;
     }
   }
   return Promise.reject(error);
 }
);
```

```typescript
// src/auth/tokenStore.ts — access token in MEMORY only, never localStorage
let _token: string | null = null;
export const tokenStore = {
 get: () => _token,
 set: (t: string) => { _token = t; },
 clear: () => { _token = null; },
};
```

---

## 8. Frontend Security Checklist

- Access token stored in **memory only** (`tokenStore.ts`) — never `localStorage` or `sessionStorage`
- Refresh token is `HttpOnly` cookie
- Single-flight refresh queue implemented
- `DOMPurify` on all rich text rendering
- All state-changing requests use JWT Bearer header
- All forms validated with React Hook Form + Zod
- All protected routes wrapped with `<RequireAuth>`

---

## 9. AI Workflow, CI & Git Hygiene

- Never paste production secrets in prompts
- Before installing any package: check npmjs.com + web search advisories + verify via `npm show <pkg> version`
- Commit `.gitignore` and `.cursorignore`
- CI pipeline: `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm audit --audit-level=high`

---

## 10. Postman & Testing Guide

- Import `backend/postman/collection.json` and `backend/postman/environment.json`
- Follow sequential run order (Register → Login → Get Me → CRUD resource → Refresh → Logout)
- Test happy path, validation errors (400), unauthorized (401), forbidden (403), not found (404), rate limit (429), and conflict (409).

---

## 11. Master Prompts

Use the prompts provided in Section 11 when generating backend, frontend, full-stack, or security hardening implementations.

## 12. Domain Add-On Prompts

- Scheduling / Calendar (FullCalendar, RRule, date-fns-tz, Web Push)
- E-Commerce / Marketplace (Stripe, order state machine, Cloudinary)
- Project Management / CRM (Kanban, fractional indexing, S3 attachments)
- Analytics / Dashboard (Chart.js / Recharts, aggregations, Redis cache)
- Social / Community (Cursor pagination, moderation, Atlas Search)

---

*Industry-agnostic. Adapt the domain add-ons in Section 12 for your use case.*
