# HireFlow AI — Applicant Tracking System & HR Document Automation

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Security Audit](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen.svg)](https://npmjs.com)
[![Express 5](https://img.shields.io/badge/Express-5.x-green.svg)](https://expressjs.com/)
[![React 19](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)

**HireFlow AI** is an AI-powered Applicant Tracking System, recruitment management, and HR document automation platform built for growing companies (10–300 employees) with an **India-first focus** (incorporating Indian CTC structures, statutory components, notice period dynamics, and multi-level approval workflows).

---

## 🏗 System Architecture

The project is structured according to the **Full-Stack Project Blueprint v2.2** ([PROJECT_BLUEPRINT.md](docs/PROJECT_BLUEPRINT.md)):

```
HireFlow/
├── backend/
│   ├── src/
│   │   ├── config/              # Zod-validated env, MongoDB connection
│   │   ├── middleware/          # requireAuth, roleGuard, validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/            # JWT 15m access / 7d HttpOnly refresh rotation
│   │   │   ├── organizations/   # Multi-tenancy & team invitations
│   │   │   ├── jobs/            # Openings, requirements, AI JD drafting
│   │   │   ├── candidates/      # Profile, duplicate detection, pipeline
│   │   │   ├── interviews/      # Scheduling & blind scorecards
│   │   │   ├── offers/          # Indian CTC builder & multi-tier approval
│   │   │   └── dashboard/       # Recruitment metrics & KPIs
│   │   ├── sockets/             # Socket.IO real-time pipeline events
│   │   ├── utils/               # CTC calculator, fit score engine, crypto
│   │   ├── app.ts               # Express 5 security chain
│   │   └── server.ts            # Entrypoint
│   ├── postman/                 # Postman collection & environment
│   └── tsconfig.json            # TypeScript strict mode
│
├── frontend/
│   ├── src/
│   │   ├── auth/                # In-memory token store & AuthProvider
│   │   ├── lib/api/             # Axios client with single-flight refresh queue
│   │   ├── pages/               # Dashboard, Jobs, Pipeline, Interviews, Offers
│   │   ├── components/          # RequireAuth, ErrorBoundary, Navbar
│   │   └── App.tsx              # React 19 router & layout
│   └── tsconfig.json
│
└── docs/
    ├── PROJECT_BLUEPRINT.md     # Architecture and prompt blueprint
    └── BACKEND_PLANNING.md      # Data schemas, state machines & formulas
```

---

## ⚡ Core Features

1. **Deterministic Candidate Fit Score (0–100%)**:
   Strictly implements PRD §11.19:
   - 30% Mandatory Skills match
   - 25% Relevant Experience
   - 15% Role & Industry similarity
   - 10% Preferred Skills
   - 10% Education & Certifications
   - 5% Project relevance
   - 5% Availability & Notice Period fit
   Includes human score override with mandatory audit reasoning (PRD §11.22).

2. **Indian CTC Salary Engine**:
   Automated calculation and mathematical validation:
   `Basic + HRA + Special Allowance + Retirals (PF + Gratuity) + Annual Bonus == Annual CTC`

3. **Multi-Level Offer Approval Workflow**:
   3-tier sequential review:
   - Level 1: Hiring Manager (Designation & Role)
   - Level 2: Finance Approver (Salary Grid)
   - Level 3: Organization Admin / HR Head (Terms)

4. **Candidate Offer Portal & E-Signature**:
   Secure tokenized portal (`/offers/view/:token`) tracking first/last view dates, real-time salary annexure breakdown, and electronic signature capture.

5. **Blind Interview Scorecards**:
   Per PRD §11.39, interviewers cannot view peer evaluations until their own scorecard is submitted.

6. **Interactive Kanban Pipeline**:
   Visual candidate movement across 12 customizable stages with real-time Socket.IO synchronization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js **Active LTS** (v20+ or v24+)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)

### 1. Clone & Configure Environment

```bash
# Backend configuration
cd backend
cp .env.example .env
# Fill in JWT secrets and MONGODB_URI

# Frontend configuration
cd ../frontend
cp .env.example .env
```

### 2. Install & Seed Sample Data

```bash
# Install backend dependencies (npm audit clean, 0 vulnerabilities)
cd backend
npm install

# Seed mock organization, users, jobs, candidate scores, and offers
npx tsx src/seed.ts
```

**Seed Credentials:**
- Email: `admin@techscale.io`
- Password: `P@ssword123!`

### 3. Run Development Servers

```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

Visit **http://localhost:5173** to access the HireFlow AI dashboard.

---

## 🧪 Postman & API Testing

Import the provided files into Postman:
- Collection: `backend/postman/collection.json`
- Environment: `backend/postman/environment.json`

Set `baseUrl` to `http://localhost:5000`. The collection includes automated pre-request scripts and test scripts to capture and inject access tokens.

---

## 🛡 Security & Verification Baseline

Run the minimal CI checks locally:
```bash
# Backend Typecheck & Audit
cd backend
npx tsc --noEmit
npm audit --audit-level=high

# Frontend Typecheck & Build
cd ../frontend
npm run build
```
