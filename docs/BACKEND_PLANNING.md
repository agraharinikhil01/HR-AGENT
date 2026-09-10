# HireFlow AI — Backend Planning & Technical Specification

## 1. Domain Architecture & Multi-Tenancy

HireFlow AI enforces organization-level multi-tenancy. Every tenant-scoped entity contains an `orgId` reference pointing to the `Organization` collection.

### Core Entities:
1. **Organization**: Company metadata, default currency (INR), timezone, address, logo, retention policy.
2. **User**: Authentication credentials, associated `orgId`, role (`SUPER_ADMIN`, `ORG_ADMIN`, `RECRUITER`, `HIRING_MANAGER`, `INTERVIEWER`, `FINANCE_APPROVER`, `CANDIDATE`), hashed refresh token array for token rotation.
3. **Department**: Organization departments (Engineering, Product, Sales, HR, etc.).
4. **Job**: Job openings with department, recruiter, hiring manager, salary range, employment type, requirements (mandatory, preferred, disqualifying).
5. **Candidate**: Person records with contact information, experience, current/expected salary, notice period, skills, duplicate tracking hashes.
6. **Application**: Junction of `Candidate` + `Job`, tracking current pipeline stage, candidate fit score, eligibility status, recruiter notes.
7. **Scorecard**: Structured interviewer evaluation with 1-5 competency ratings, recommendation, and blind feedback privacy lock.
8. **Offer**: Offer letters with Indian CTC breakdown (Basic, HRA, Special Allowance, PF, Gratuity, Bonus), multi-level approval status chain, candidate viewing metrics, and digital signature acceptance.
9. **AuditLog**: Immutable action log recording changes, actors, timestamps, and previous/new values.

---

## 2. State Machines

### 2.1 Job Status Lifecycle
`Draft` ➔ `Awaiting Approval` ➔ `Open` ⇄ `Paused` ➔ `Closed` ➔ `Archived` / `Filled`

### 2.2 Candidate Pipeline Stages (PRD §11.24)
1. `Applied`
2. `AI Reviewed`
3. `Recruiter Review`
4. `Shortlisted`
5. `Screening Call`
6. `Interview`
7. `Assessment`
8. `Final Interview`
9. `Offer Approval`
10. `Offer Sent`
11. `Offer Accepted`
12. `Joined`

*Auxiliary/Terminal Stages:* `On Hold`, `Rejected`, `Candidate Withdrew`, `Offer Declined`.

### 2.3 Offer Approval Workflow (PRD §11.46)
`Draft` ➔ `Pending Approval` (Step 1: Hiring Manager ➔ Step 2: Finance ➔ Step 3: HR Head) ➔ `Approved` ➔ `Sent` ➔ `Viewed` ➔ `Accepted` / `Rejected` / `Expired` / `Revised`

---

## 3. Indian CTC Mathematical Model (PRD §11.44 - 11.45)

All currency stored in integer units (Rupees, INR).

1. **Annual CTC (Total Cost to Company)** = Fixed Compensation + Variable / Performance Bonus + Employer Contributions.
2. **Fixed Compensation Components**:
   - **Basic Salary**: Typically 40% to 50% of Annual Gross.
   - **House Rent Allowance (HRA)**: Typically 40% to 50% of Basic.
   - **Special Allowance**: Balancing component to meet Gross Salary.
3. **Retiral & Statutory Benefits**:
   - **Employer PF**: 12% of Basic salary (statutory ceiling: ₹1,800/month or uncapped based on company policy).
   - **Gratuity**: ~4.81% of Basic salary (statutory formula: (15 * Basic) / (26 * 12)).
4. **Validation Rules**:
   - `Monthly Gross * 12 + Retirals + Annual Bonus == Annual CTC`
   - Component values cannot be negative.
   - Special allowance automatically absorbs remainder.

---

## 4. Candidate Fit Score Engine (PRD §11.19)

Formula:
- **Mandatory Skills Match**: 30%
- **Relevant Experience Fit**: 25%
- **Role & Industry Similarity**: 15%
- **Preferred Skills Match**: 10%
- **Education & Certifications**: 10%
- **Project Relevance**: 5%
- **Availability & Notice Period**: 5%
Total: **100 points**

Eligibility Check:
- If any Mandatory Requirement fails ➔ `Eligibility: FAILED` with human override option.
- Explanations generated: Strengths, Missing Info, Gaps.
