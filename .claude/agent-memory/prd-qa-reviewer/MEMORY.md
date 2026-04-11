# Memory Index

- [Sales Return Upload Flow](project_sales_return_upload.md) — BGRD:MRCO sales return adapter; sync/refresh icon for Partially Processed; no eye icon; SalesReturnNo increment; recalculateGrossAmount sidecar pattern
- [recalculateGrossAmount Implementation Gap](project_gross_amount_gap.md) — CGST+UTGST tax path missing from dataUtils.js; PRD requires it; current impl only handles CGST/SGST and IGST paths
- [Marico Brand Return Field Mapping](reference_marico_field_map.md) — Full field-to-table mapping for BGRD:MRCO Sales Return adapter; Reason field has no CDMS table; SalesReturnNo is new column; order_id lookup via fc_id+brand_id+invoice_number
- [PRD QA Patterns](feedback_prd_qa_patterns.md) — Recurring PRD gaps seen across CDMS adapter PRDs: missing error states for lookup failures, undefined Reason field handling, no rollback spec on partial failures
