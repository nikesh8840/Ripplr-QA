---
name: Marico Brand Return CSV Field Mapping Reference
description: Maps each CSV column in MARCO_BrandReturn.csv to its CDMS target table and special handling rules
type: reference
---

CSV file: `test-data/bgrd-mrco-reutrn/MARCO_BrandReturn.csv`

Header columns confirmed from actual file (2026-04-11):
DistrBrName, SalesReturnDt, SalesReturnNo, Reg InvoiceNumber, GodownName, RouteName, SalesmanName, CustomerName, distrCustomerCode, HSNCode, Brand Name, ProductCode, ProductName, prodBatchCode, PDA Batch, Reason, Remarks, OLD MRP, NEW MRP, Saleable Qty, UnSaleable Qty, FreeQty, TotalReturnQty, Gross Amount, DB Disc, Cash Disc, Sch Disc, SM Discount, LND DiscgetSalesReturnBeangetDownloadount, Add Tot, CGST Perc, CGSTAmt, SGST Perc, SGSTAmt, IGST Perc, IGSTAmt, Tax Perc, Tax Amount, Net Amount

Key mapping notes:
- SalesReturnNo → brand_return.Return_no (NEW column, add to DB schema)
- Reg InvoiceNumber → find order_id via fc_id+brand_id+invoice_number; save order_id; if blank → order_id = NULL
- CustomerName + distrCustomerCode → Stores table lookup (Retailer Code + Name); create if not found
- ProductCode + ProductName → Products table lookup; create if not found
- Reason → no CDMS table or validation specified (open ambiguity — is it stored or discarded?)
- LND DiscgetSalesReturnBeangetDownloadount → Ignore (corrupted field name — likely truncation artifact)
- Gross Amount → recalculated via tax formula before storage, saved to 4 decimal places
- discount_info is a JSON column in brand_return_detail storing DB Disc, Cash Disc, Sch Disc, SM Discount
- tax_info is a JSON column storing CGST%, cgst_amt, sgst%, sgst_amt, igst%, igst_amt
