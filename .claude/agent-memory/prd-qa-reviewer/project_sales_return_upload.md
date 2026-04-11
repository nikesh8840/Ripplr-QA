---
name: Sales Return Upload Flow — BGRD:MRCO
description: Navigation pattern, upload method, increment strategy, and DB verification approach for the Marico brand sales return adapter
type: project
---

The BGRD:MRCO Sales Return upload uses `UploadBgrdMrcoSalesReturn` in `pages/Aupload.page.js` — NOT `UploadSinglefileFcBrand`. The modal uses a `getByRole('button', { name: /Upload a File/i })` file chooser pattern, not `setInputFiles` directly on ant-space inputs.

**Why:** Sales Return modal renders a single Upload button (not the multi-input ant-space pattern used for Sales Orders).

**How to apply:** Any new Sales Return upload method for other FC/Brand combos should follow `UploadBgrdMrcoSalesReturn` as the template, not the Sales Order helpers.

The upload table uses a **sync/refresh icon** (not the eye icon) to surface "Partially Processed" error details — `_searchAndVerify` handles this via `l.syncIcon.click()` when row text includes 'Partially'.

`salesReturnBgrdMrcoWithIncrement` in `utils/uploadTestHelper.js` orchestrates:
1. `recalculateGrossAmount(filePath)` — recalculates Gross Amount from CGST/SGST or IGST tax %
2. `syncInvoiceNumbers(salesOrderPath, filePath, 'Bill Number', 'Reg InvoiceNumber', 3)` — syncs first 3 rows
3. `incrementBillNumbers(filePath, 'SalesReturnNo')` — prevents duplicate-file rejection

`recalculateGrossAmount` uses a `.orig.json` sidecar file for idempotency so values do not compound across runs.

DB verification test polls `cdms.Files` for `fully_processed` status then joins `brand_return` + `brand_return_detail` on `file_id` to assert gross amounts within ±0.02 tolerance.

Test spec: `tests/adaptorupload/bgrd-mrco-salesreturn.spec.js`
Test data: `test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv`
