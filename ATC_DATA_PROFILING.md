# Agrawal Trading Company (ATC) — Data Profiling Report

**Date**: August 2026  
**Scope**: Phase 1 Deep Dataset Value Profiling  
**Datasets Analyzed**: 5 production sample files from Marg ERP

---

## 1. Executive Dataset Summary

| Dataset File | Format | Row Count | Source System | Primary Domain | Business Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`partymASTER.xls`** | Excel (BIFF8) | 3,060 | Marg ERP Party Master | `Business / Account` & `Person` | Master directory of B2B dealers, chemists, hospitals, suppliers, and field staff. |
| **`date_wise_sale_&_purchase_analysis.csv`** | CSV | 86,785 | Marg ERP Journal | `Transaction`, `Invoice`, `Product` | ₹96.81M in sales, ₹93.82M in purchases, returns, batch quantities, taxes, and margins. |
| **`OUTSTANDING LEDGER.xls`** | Excel (BIFF8) | 633 | Marg ERP Ageing Report | `Outstanding / Receivables` | ₹15.48M in receivables, -₹28.03M in payables, and 12-month ageing buckets. |
| **`OPENING STOCK.XLS`** | Excel (BIFF8) | 4,153 | Marg ERP Inventory | `Inventory`, `Product` | 307,011 units across 4,153 distinct SKUs on 01-04-2026. |
| **`BANK & CASH LEDGERS.XLS`** | Excel (BIFF8) | 3,573 | Marg ERP Multi-Ledger | `Payment`, `Financial Movements` | Bank and cash receipts, vouchers, payments, and balances across 7 bank accounts. |

---

## 2. Dataset-by-Dataset Profiling Details

### 2.1 `partymASTER.xls` (Party Master)
- **Total Records**: 3,060 rows, 37 columns.
- **Key Identifiers**:
  - `tin` (GSTIN): 1,310 verified GSTIN numbers (e.g. `09DZFPS5527D1Z4`, `09ABIFA7889G1ZT`).
  - `panno` (PAN): 1,186 PAN numbers (e.g. `DZFPS5527D`, `AEHPC3566J`).
  - `licence` (Drug License): 2,593 drug licenses (e.g. `UP7020B003144,UP7021B0031`).
  - `name` / `ledger`: Trade and ledger names (e.g. `AJAY MEDICAL CENTRE`, `123MEDICAN CENTER`).
- **Contact Details**: 594 emails, 1,264 mobile numbers.
- **Geographic Attributes**: 29 distinct cities, 109 distinct areas, and route names (e.g., `KATRA`, `CIVIL LINE`, `LEADER ROAD`).
- **Credit Policy Fields**: `crdays`, `cramount` (Credit Limit ₹), `limitbill`, `limitday`, `limittype` ("Only Indicate", "Stop Bill").
- **Target Canonical Domain**: `Business / Account` (B2B Chemists/Hospitals), `Supplier` (Creditors), `Person` (Field Staff / Individual Buyers).

### 2.2 `date_wise_sale_&_purchase_analysis.csv` (Sales & Purchase Analysis)
- **Total Records**: 86,785 rows, 24 columns.
- **Transaction Types Breakdown**:
  - `Sale` (Sales Invoices): 72,105 rows (Net: ₹96,813,395.12, GST Tax: ₹5,634,463.95).
  - `Purc` (Purchase Invoices): 13,073 rows (Net: ₹93,824,668.94, GST Tax: ₹5,458,990.69).
  - `S/Re` (Sale Returns): 873 rows.
  - `Brk/` (Breakages / Damages): 539 rows.
  - `Stk.` (Stock Adjustments): 96 rows.
  - `P/Re` (Purchase Returns): 93 rows.
  - `Pric` (Price Difference Adjustments): 5 rows.
- **Entities Involved**:
  - 1,172 distinct Parties (`PNAME`, `PTGSTNO`).
  - 4,266 distinct Pharmaceutical Products (`NAME`).
  - 169 distinct Manufacturers/Brands (`COMPANY`, e.g. `U.S.V.`, `SUN PHARMA`, `MANKIND`).
- **Date Range**: Spanning full financial year (Indian Date format: `01-Apr-2026` to `31-Mar-2027`).
- **Target Canonical Domain**: `Transaction`, `Invoice`, `Product`, `Order`.

### 2.3 `OUTSTANDING LEDGER.xls` (Outstanding & Ageing Ledger)
- **Total Records**: 633 accounts.
- **Financial Balances**:
  - Positive Receivables (Debtors / Chemist Stores): ₹15,485,544.07
  - Negative Payables (Creditors / Pharma Suppliers): -₹28,033,636.39
  - Net Balance: -₹12,548,092.32
- **Ageing Time Buckets**: 12 monthly serial date columns (`46235`, `46204`, `46174`, `46143`, `46113`, `46082`, `46054`, `46023`, `45992`, `45962`, `45931`, `Sep 2025+Older`).
- **Target Canonical Domain**: `Outstanding / Receivables`, `Financial Block`, `Business 360`.

### 2.4 `OPENING STOCK.XLS` (Opening Stock Inventory)
- **Total Records**: 4,153 SKUs (307,011.6 total physical units on hand).
- **Structure**: Company header banner in rows 0–6; table headers at row index 7 (`Description`, `Opening Stock Unit`).
- **Target Canonical Domain**: `Inventory`, `Product`.

### 2.5 `BANK & CASH LEDGERS.XLS` (Bank & Cash Ledgers)
- **Total Records**: 3,573 entries across 7 main banking and cash ledgers (`AXIS BANK`, `BANK OF MAHARASHTRA 5111`, `HDFC BANK-4470`, `HDFC-GOOGLEPAY`, `ICICI BANK`, `YES BANK 522`, `CASH`).
- **Fields**: `Date`, `Voucher No.`, `Particulars` (Cheque No. / Invoice linkages), `Receipt`, `Payment`, `Balance`, `Dr/Cr`.
- **Target Canonical Domain**: `Payment`, `Financial Movements`.
