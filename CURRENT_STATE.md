# Project Conductor — Current State Architecture & Audit Report

**Date**: August 2026  
**Auditor**: Senior Solution Architect & Data Architect Team  
**Scope**: Architecture Freeze & Baseline Audit (Phase 0)  
**Target Client**: Agrawal Trading Company (ATC) / Multi-Tenant Enterprise CDP

---

## 1. Architecture Summary Matrix

| Area | Status | Evidence in Codebase | Action Required |
| :--- | :--- | :--- | :--- |
| **Ingestion Pipeline** | Working | `src/core/workflow/workflow-orchestrator.ts`, `src/core/services/job.service.ts` | Preserve 18-stage pipeline; connect canonical mapping layer. |
| **Connectors** | Working | `src/core/connectors/` (CSV, Excel, JSON, Parquet, Folder, Storage Adapters) | Extend Excel parser with smart table header detection; extend CSV with ERP delimiters. |
| **Storage Adapters** | Working | `src/core/storage/storage-adapter.ts`, `src/core/services/r2.service.ts` (Local, R2, S3, Azure, GCS) | Preserve; ensure persistent JSON/Parquet storage for canonical tables. |
| **Data Validation** | Partial | `src/core/services/validation.service.ts` | Make validation domain-aware (B2B Business, Sales, Purchases, Stock, Ledger) instead of assuming consumer PII columns by default. |
| **Transformation** | Partial | `src/core/services/transformation.service.ts` | Improve Indian date parsing (`01-Apr-2026`, `DD/MM/YYYY`) and prevent dropping records with non-standard emails. |
| **Identity Resolution** | Working | `src/core/identity/identity.service.ts`, `src/core/customer360/services/identity-resolution.service.ts` | Unify into single resolution framework supporting both Person (Customer 360) and Account/Org (Business 360). |
| **Customer 360** | Working | `src/core/customer360/`, `src/infrastructure/repositories/customer-repository.ts`, `src/app/customer360/` | Preserve person/contact-centric view, PII masking, identity graph, and audience segment builder. |
| **Business 360** | Missing | No dedicated repository or UI page for organization/account-centric view | Build `BusinessRepository` and `src/app/business360/page.tsx` linked by GSTIN, PAN, and ERP Party Code. |
| **Canonical Data Model** | Missing | Data stored ad-hoc in CSV/JSON columns without formal canonical contracts | Create `src/core/domain/canonical-models.ts` with `Business`, `Transaction`, `Product`, `Inventory`, `Outstanding`, `Payment`. |
| **Field Mapping Layer** | Missing | Direct column reads without declarative source-to-canonical mapping | Create `src/core/mapping/canonical-mapping.service.ts` and adapters for Marg ERP, generic CSV, Excel. |
| **Generic Reporting** | Missing | No configurable metric/dimension reporting engine | Build `src/core/reports/report.service.ts` and pages for Sales, Purchases, Outstanding, Inventory, Reports. |
| **ERP / CRM Adapters** | Missing | No adapter boundary between ERP files/APIs and canonical Conductor models | Build adapter layer (`src/core/adapters/erp-adapter.ts`). |
| **Scheduling & Freshness** | Missing | No persistent schedule runner or freshness latency tracker | Build persistent scheduler (`src/core/scheduler/scheduler.service.ts`) with last sync, latency, and status. |
| **Workflow Automation** | Partial | Graph UI exists (`src/components/InteractiveWorkflow.tsx`), but business rule evaluation is missing | Build lightweight Trigger -> Condition -> Action rule evaluator (`src/core/automation/automation.service.ts`). |
| **UI Design System** | Working | Vanilla CSS design tokens (`dashboard.css`, `customer360.css`, `ingestion.css`, `sidebar.css`), Dark/Light mode | Preserve design tokens; align navigation to enterprise production standard. |
| **Testing Suite** | Missing | No unit/integration tests in `src/` | Build comprehensive test suite verifying all 5 ATC datasets and failure modes. |

---

## 2. Detailed Subsystem Analysis

### 2.1 Ingestion & Connectors
- **Connector Plugin Interface**: Clean implementation in `src/core/connectors/connector.ts` (`ConnectorPlugin`).
- **Plugins Available**: `CsvConnector`, `ExcelConnector`, `JsonConnector`, `ParquetConnector`, `FolderConnector`.
- **Workflow State Machine**: 18 stages orchestrated in `src/core/workflow/workflow-orchestrator.ts`. Stage pausing and interactive confirmation work via `/api/v1/workflows/[workflowId]/confirm`.
- **Finding**: The Excel parser (`ParserFactory.parseExcel`) currently reads `rawRows[0]` as table headers. Real ATC Marg ERP files (`OPENING STOCK.XLS`, `BANK & CASH LEDGERS.XLS`) include 5–7 header lines of business identity (`AGRAWAL TRADING CORPORATION`, phone, GSTIN, DL No.) before the actual table header. Smart header row detection must be added without breaking standard spreadsheets.

### 2.2 Entity Resolution & 360 Architecture
- **Single Resolution Rule**: Existing Customer 360 uses deterministic namespace UUIDv5 anchors (`email:`, `phone:`, `pan:`, `aadhaar:`, `customerId:`).
- **Business 360 Distinction**:
  - **Customer 360** = Person/consumer-centric (`name`, `email`, `phone`, `pan`, `aadhaar`, `behavioralEvents`, `piiTags`).
  - **Business 360** = Organization/account-centric (`name`, `taxId`/GSTIN, `pan`, `drugLicenses`, `creditLimit`, `creditDays`, `area`, `route`, `classification`, `outstanding`, `salesHistory`, `purchaseHistory`).
- **Classification Principle**: Unknown records remain `UNKNOWN` when evidence is insufficient. Never assume "no GST = B2C".

### 2.3 Storage & Persistence
- **Storage Adapter Factory**: Supports Local filesystem simulation, Cloudflare R2 (`@aws-sdk/client-s3`), AWS S3, Azure Blob, GCS.
- **Layers**:
  - `data/raw/`: Immutable NDJSON raw data stream.
  - `data/normalized/`: Clean, deduplicated JSON entities.
  - `data/parquet/`: Columnar exports with generated schemas.
  - `data/ready/` (Gold): Persistent canonical tables for reporting.

### 2.4 Navigation & UI Layout
- **Current Navigation**: Platform (`/`, `/ingestion`, `/contexthouse`, `/customer360`, `/spiderbrain`), Execution (`/agents`, `/marketing`, `/destinations`).
- **Production Target Navigation**:
  - `Dashboard` (`/`)
  - `Customer 360` (`/customer360`)
  - `Business 360` (`/business360`)
  - `Sales Intelligence` (`/sales`)
  - `Purchase Intelligence` (`/purchases`)
  - `Inventory & Stock` (`/inventory`)
  - `Outstanding & Receivables` (`/outstanding`)
  - `Generic Reports` (`/reports`)
  - `Data Ingestion` (`/ingestion`)
  - `Data Sources & Integrations` (`/integrations`)
  - `Workflow Automation` (`/workflows`)
  - `Settings` (`/settings`)

---

## 3. Freeze Confirmation
Phase 0 audit is complete. Architecture baseline is frozen. All changes will strictly adhere to the phased P0 -> P1 -> P2 -> P3 -> P4 order.
