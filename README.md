# ATC Conductor — Enterprise B2B Operations & CDP Platform

> **An intelligent, real-time B2B Customer Data Platform (CDP), ERP Data Ingestion Engine, and Business Intelligence System designed for wholesale distribution, pharmaceuticals, and multi-ledger enterprises.**

[![Acceptance Tests](https://img.shields.io/badge/Acceptance%20Tests-8%2F8%20Passing-success?style=for-the-badge&logo=checkmarx)](file:///d:/conductor_new/test_master_acceptance.ts)
[![Enterprise BRS](https://img.shields.io/badge/Enterprise%20BRS-10%2F10%20Verified-blue?style=for-the-badge)](file:///d:/conductor_new/test_bank_reconciliation_enterprise.ts)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 📌 Executive Summary & Problem Solved

Traditional ERP systems (e.g., Marg ERP, Tally) suffer from duplicate ledger entries, fragmented debtor risk tracking, rigid schemas, and manual month-end reconciliation.

**ATC Conductor** transforms legacy ERP dumps into an actionable, real-time command center:
1. **Unified B2B Identity Resolution:** Merges multiple disparate ledger entries (`"Sharma Med"`, `"Sharma Medical Store"`) into a single canonical business entity keyed by verified GSTIN/PAN with complete alias ledger traceability.
2. **Dynamic Credit & Debt Aging Engine:** Computes dynamic credit limits ($1.5\times$ of 45-day average monthly purchases) and color-coded overdue aging buckets (`0–30d`, `31–60d`, `61–90d`, `90d+`) with prioritized 4-tier payment recovery plans.
3. **Automated Bank Reconciliation (BRS):** 4-pass deterministic matching engine (Reference Exact, Multi-Reference Aggregate, Party + Amount Fuzzy, and Discrepancy Classification) matching bank statements against ERP accounting vouchers.
4. **Running SKU Inventory Ledger:** Single-pass $O(N)$ closing stock arithmetic with consumption-weighted reorder threshold alerts.
5. **Editable Schema Studio & Real-Time Cascade:** In-app data dictionary to customize standard ERP terminology and add custom parameters (e.g., *WhatsApp Opt-in*, *Doctor Specialty*) with zero-downtime cascading migrations across stored records.
6. **Ask Conductor (Local On-Premise AI):** Grounded conversational business assistant powered by local Ollama (`llama3`) for zero-hallucination querying over business data.

---

## 🏗️ System Architecture & Data Flow

```
                           ┌────────────────────────────────────────────────────────┐
                           │          RAW ERP DUMPS & MULTI-FORMAT INPUTS           │
                           │  (Marg ERP, Tally, Excel .xls/.xlsx, CSV, S3, R2 Blob) │
                           └───────────────────────────┬────────────────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │     PARSER & INGESTION STAGE      │
                                     │  • Smart Header Auto-Detection    │
                                     │  • Rejection & Quarantine Log     │
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │     CANONICAL MAPPING LAYER       │
                                     │  • Sign Correction & Normalization│
                                     │  • Strict Domain Models           │
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              CORE COMPUTATIONAL ENGINES                                             │
├──────────────────────────┬──────────────────────────┬──────────────────────────┬────────────────────────────────────┤
│   IDENTITY RESOLUTION    │  DYNAMIC CREDIT ENGINE   │   RUNNING SKU LEDGER     │       BANK RECONCILIATION          │
│ • Deterministic UUIDv5   │ • 45-day rolling avg     │ • Single-pass O(N)       │ • Multi-pass rule matrix           │
│ • GSTIN/PAN canonical id │ • Dynamic multipliers    │ • Closing stock formula  │ • Multi-ref aggregation            │
│ • Multi-ledger aliases   │ • Risk aging buckets     │ • Reorder threshold flag │ • Date & Amount variance tolerance │
└──────────────────────────┴──────────────────────────┴──────────────────────────┴────────────────────────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │    STORAGE & INDEXING SUBSYSTEM   │
                                     │  • In-Memory Map Indices (O(1))   │
                                     │  • Atomic .tmp -> rename File I/O │
                                     │  • Custom Schema Migration Engine │
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │      API & SECURITY GATEWAY       │
                                     │  • Cryptographic HMAC RBAC Tokens │
                                     │  • 403 Server-Side Enforcement    │
                                     │  • Audit Trail Logging            │
                                     └─────────────────┬─────────────────┘
                                                       │
                                                       ▼
                                     ┌───────────────────────────────────┐
                                     │       COMMAND & INSIGHT UI        │
                                     │  • Glassmorphism Dark/Light Mode  │
                                     │  • Ask Conductor Local AI Chat    │
                                     │  • Real-time Entity Drawers       │
                                     └───────────────────────────────────┘
```

---

## 🚀 Key Modules & Routes

### 1. Command & Customers
* **Live Overview (`/`):** Executive dashboard displaying daily sales volume, active debtors, stock health, and sync pipelines.
* **B2B Directory / Business 360 (`/business360`):** Single source of truth for all pharmacy dealers, hospitals, doctors, and vendors with credit utilization and alias ledgers.
* **Customer 360 (`/customer360`):** CDP profile tracking consumer behavioral events, payment reliability scores, and PII masking.
* **Ask Conductor (`/assistant`):** Local on-premise AI assistant answering questions on outstanding balances, low stock, daily sales, and collection strategies.

### 2. Shop Operations & Intelligence
* **Sales & Invoices (`/sales`):** Searchable invoice repository with line-item GST breakdowns.
* **Purchases & Spend (`/purchases`):** Procurement tracker for manufacturer bills and input tax credit (ITC).
* **Stock & Reorder (`/inventory`):** Inventory valuation, batch tracking, and low-stock replenishment baseline alerts.
* **Item Ledger (`/item-ledger`):** Running SKU ledger calculating exact closing balances from historical transactions.
* **Receivables & Ageing (`/outstanding`):** Automated aging analysis categorizing outstanding balances into 30/60/90+ day risk bands.
* **Bank Reconciliation (`/reconciliation`):** Multi-pass automated matching of bank statements (NEFT/RTGS/UPI/Cheques) with accounting vouchers.
* **Custom Reports (`/reports`):** 1-click auditor and GST-ready report exports with complete mathematical provenance formulas.

### 3. Data Pipelines & Governance
* **Connect Data / Universal Ingestion (`/ingestion`):** Drag-and-drop ingestion engine supporting Excel, CSV, Parquet, JSON, S3, R2, and Azure Blob storage with automated validation and quarantine tracking.
* **ERP Sync Jobs (`/integrations`):** Scheduled background sync jobs for automated ledger synchronization.
* **Alerts & Rules (`/workflows`):** Automation trigger builder for overdue payment reminders, WhatsApp alerts, and inventory thresholds.
* **Data Schema Lineage (`/contexthouse`):** End-to-end data provenance tracking raw data $\rightarrow$ clean staging $\rightarrow$ business models.
* **Schema Studio & Dictionary:** In-app data dictionary to rename ERP parameters and manage custom attributes with zero downtime.
* **Settings & Access Control (`/settings`):** Role-based access control (RBAC), password changes, and audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Server Actions, API Route Handlers, React Server Components |
| **Runtime & UI** | React 19, TypeScript 5.x | Strictly typed domain models and components |
| **Styling** | Vanilla CSS Design System | Custom design tokens, dark/light theme toggle, glassmorphism |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible iconography |
| **Data Parsers** | `xlsx`, `csv-parse`, `@aws-sdk/client-s3`, `zod` | Multi-format legacy file parsing with smart header detection |
| **Workflow Engine** | `@xyflow/react` (React Flow) | Visual automation node graph |
| **Local AI Engine** | [Ollama](https://ollama.ai/) (`llama3`) | Strict JSON intent extraction and grounded business advisory |
| **Security** | Node.js `crypto` (HMAC-SHA256) | Cryptographically signed session tokens and server-side RBAC |

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
* **Node.js:** v18.17.0 or higher (v20+ recommended)
* **Package Manager:** `npm` (bundled with Node.js), `yarn`, or `pnpm`
* **Git:** Installed and configured
* **Ollama (Optional, for Ask Conductor AI):** [Download Ollama](https://ollama.ai/) and run `ollama run llama3`

---

## ⚙️ Installation & Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/NEHAJAKATE/Conductor-new.git
cd Conductor-new
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
> The application will start at **[http://localhost:3000](http://localhost:3000)**.

### 4. (Optional) Start Local AI for Ask Conductor
```bash
ollama run llama3
```

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Running Verification & Acceptance Tests

The repository includes comprehensive automated test suites verifying financial arithmetic, reconciliation accuracy, disk persistence, and security:

```bash
# Run Master Acceptance Suite (8/8 Tests: Net Sales, Purchases, Stock Arithmetic, Disk Restart, RBAC)
npx tsx test_master_acceptance.ts

# Run Enterprise Bank Reconciliation Suite (10/10 BRS Scenarios)
npx tsx test_bank_reconciliation_enterprise.ts

# Run Dynamic Credit Limit Verification
npx tsx test_credit_limits.ts

# Run Credit Audit Suite
npx tsx audit_credit_checks.ts
```

---

## 📁 Project Directory Structure

```text
conductor-new/
├── data/
│   ├── atc_sample_data/          # Real ERP sample datasets (Marg XLS, CSV journals, Stock sheets)
│   └── ready/                    # Canonical domain stores (businesses, transactions, inventory, schema)
├── src/
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── api/v1/               # REST API endpoints (schema, business360, assistant, reports, etc.)
│   │   ├── assistant/            # Ask Conductor Local AI Chat Interface
│   │   ├── business360/          # B2B Directory & entity drawers
│   │   ├── customer360/          # Customer Identity & CDP profiles
│   │   ├── ingestion/            # Universal Data Ingestion & Rejection Log
│   │   ├── inventory/            # Stock valuation & reordering
│   │   ├── item-ledger/          # Running SKU balance ledger
│   │   ├── outstanding/          # Debt aging & receivables risk
│   │   ├── reconciliation/       # Bank statement matching (BRS)
│   │   ├── reports/              # Custom reporting with formula provenance
│   │   ├── sales/                # Invoices & billing
│   │   ├── purchases/            # Supplier procurement
│   │   ├── workflows/            # Automation rule builder
│   │   ├── contexthouse/         # Data lineage & schema tracking
│   │   └── settings/             # RBAC & account security
│   ├── components/               # UI components (Sidebar, SchemaStudioModal, GuidancePanel)
│   ├── core/                     # Core domain logic & computational services
│   │   ├── adapters/             # ERP file adapters (party master, journal, stock, outstanding)
│   │   ├── assistant/            # Ask Conductor business query service
│   │   ├── domain/               # Strict canonical TypeScript interfaces
│   │   ├── ingestion/            # Rejection and quarantine logger
│   │   ├── inventory/            # Single-pass running SKU stock ledger
│   │   ├── mapping/              # ERP-to-Canonical field mapping layer
│   │   ├── parser/               # Multi-format parser with smart header detection
│   │   ├── reconciliation/       # 4-pass Bank Reconciliation Engine
│   │   ├── reports/              # Report aggregation & KPI computation
│   │   ├── schema/               # Schema Studio registry & cascading data migration
│   │   └── security/             # Cryptographic HMAC RBAC & session management
│   ├── infrastructure/           # Repositories with in-memory Map indices & atomic disk I/O
│   └── lib/                      # Formatters and currency utilities
├── test_master_acceptance.ts     # Master acceptance test suite (8/8)
├── test_bank_reconciliation_enterprise.ts # Enterprise BRS test suite (10/10)
├── package.json                  # Project dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

---

## 🔐 Roles & Access Control

* **Owner / Executive Role:** Full access to financial metrics, bank reconciliation, schema customization, and automated rule triggers.
* **Staff Role:** Streamlined access to day-to-day billing, inventory stock lookup, and dispatch monitoring. Sensitive financial ledgers and bank reconciliation return `403 Forbidden`.
* Role toggle is available directly in the left sidebar for testing and demonstration.

---

## 📄 License & Attribution

Developed for **Agrawal Trading Company (ATC)** enterprise operations. All rights reserved.
