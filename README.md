# ATC Conductor — Enterprise B2B Operations & CDP Platform

> **An intelligent, real-time B2B Customer Data Platform (CDP), ERP Data Ingestion Engine, and Business Intelligence System designed for wholesale distribution, pharmaceuticals, and multi-ledger enterprises.**

---

## 📌 Executive Summary & Problem Solved

Traditional ERP systems (e.g., Marg ERP, Tally) suffer from duplicate ledger entries, fragmented debtor risk tracking, rigid schemas, and manual month-end reconciliation.

**ATC Conductor** solves these challenges by providing:
1. **Unified B2B Identity Resolution:** Merges multiple disparate ledger entries (`"Sharma Med"`, `"Sharma Medical Store"`) into a single canonical business entity keyed by verified GSTIN/PAN.
2. **Dynamic Credit & Debt Aging Engine:** Computes dynamic credit limits (1.5x of 45-day average monthly purchases) and color-coded overdue aging buckets (`0–30d`, `31–60d`, `61–90d`, `90d+`) to prevent bad debt.
3. **Editable Schema Studio & Real-Time Cascade:** Allows business owners to customize field labels to match company terminology and add custom parameters (e.g., *Doctor Specialty*, *WhatsApp Opt-in*), automatically updating all existing data records in real time.
4. **Automated Bank Reconciliation & Multi-Format Ingestion:** Ingests raw Excel (`.xlsx`, `.xls`), CSV, and JSON records with quarantine auditing for corrupted rows and automated bank voucher matching.

---

## 🚀 Key Modules & Architecture

### 1. Overview & Customers
* **Live Overview (`/`):** Executive command dashboard displaying daily sales volume, active debtors, stock health, and sync pipelines at a glance.
* **B2B Directory / Business 360 (`/business360`):** Single source of truth for all pharmacy dealers, hospitals, doctors, and vendors with credit utilization indicators.
* **Customer 360 (`/customer360`):** CDP profile tracking transaction history, payment reliability scores, and interaction timelines.

### 2. Shop Operations
* **Sales & Invoices (`/sales`):** Searchable invoice repository with line-item GST breakdowns.
* **Purchases & Spend (`/purchases`):** Procurement tracker for manufacturer bills and scheme discounts.
* **Stock & Reorder (`/inventory`):** Inventory valuation, batch tracking, and low-stock replenishment baseline alerts.
* **Receivables & Ageing (`/outstanding`):** Automated aging analysis categorizing outstanding balance into 30/60/90+ day risk bands.
* **Bank Reconciliation (`/reconciliation`):** Automated matching of bank statements (NEFT/RTGS/UPI/Cheques) with accounting vouchers.
* **Custom Reports (`/reports`):** 1-click auditor and GST-ready report exports.

### 3. Data & Pipelines
* **Connect Data / Universal Ingestion (`/ingestion`):** Drag-and-drop ingestion engine supporting Excel, CSV, Parquet, JSON, S3, R2, and Azure Blob storage with automated validation and quarantine tracking.
* **ERP Sync Jobs (`/integrations`):** Scheduled background sync jobs for automated ledger synchronization.
* **Alerts & Rules (`/workflows`):** Automation trigger builder for overdue payment reminders, WhatsApp alerts, and inventory thresholds.
* **Data Schema Lineage (`/contexthouse`):** End-to-end data provenance tracking raw data $\rightarrow$ clean staging $\rightarrow$ business models.
* **Schema Studio & Dictionary:** In-app data dictionary to rename ERP parameters and manage custom attributes with zero downtime.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
* **Runtime & UI:** React 19, TypeScript
* **Styling:** Custom Vanilla CSS Design System with Sleek Dark Mode & Glassmorphism
* **Icons:** [Lucide React](https://lucide.dev/)
* **File & Data Parsers:** `xlsx`, `csv-parse`, `@aws-sdk/client-s3`, `uuid`, `zod`
* **Workflow Engine:** `@xyflow/react` (React Flow)

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
* **Node.js:** v18.17.0 or higher (v20+ recommended)
* **Package Manager:** `npm` (bundled with Node.js), `yarn`, or `pnpm`
* **Git:** Installed and configured

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

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📁 Project Directory Structure

```text
conductor-new/
├── data/
│   └── ready/                     # Canonical domain stores (businesses, transactions, inventory)
├── src/
│   ├── app/                       # Next.js App Router pages & API routes
│   │   ├── api/v1/                # REST API endpoints (schema, business360, ingestion, etc.)
│   │   ├── business360/           # B2B Directory & entity drawers
│   │   ├── customer360/           # Customer Identity & CDP profiles
│   │   ├── ingestion/             # Universal Data Ingestion & Rejection Log
│   │   ├── inventory/             # Stock valuation & reordering
│   │   ├── outstanding/           # Debt aging & receivables risk
│   │   ├── reconciliation/        # Bank statement matching
│   │   ├── reports/               # Custom reporting
│   │   ├── sales/                 # Invoices & billing
│   │   ├── purchases/             # Supplier procurement
│   │   ├── workflows/             # Automation rule builder
│   │   └── contexthouse/          # Data lineage & schema tracking
│   ├── components/                # Reusable UI components (Sidebar, SchemaStudioModal, etc.)
│   ├── core/                      # Domain logic, canonical models, mapping & schema service
│   └── infrastructure/            # In-memory and file-persisted repositories
├── public/                        # Static assets & icons
├── package.json                   # Project dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Documentation
```

---

## 🔐 Roles & Access

* **Owner / Executive Role:** Full access to financial metrics, bank reconciliation, schema customization, and automated rule triggers.
* **Staff Role:** Streamlined access to day-to-day billing, inventory stock lookup, and dispatch monitoring.
* Role toggle is available directly in the left sidebar for testing and demonstration.

---

## 📄 License & Attribution

Developed for **Agrawal Trading Company (ATC)** enterprise operations. All rights reserved.
