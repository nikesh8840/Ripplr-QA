---
name: recalculateGrossAmount — CGST+UTGST Path Missing
description: The PRD specifies a third tax path (CGST+UTGST) for Gross Amount recalculation that is absent from the current dataUtils.js implementation
type: project
---

The Marico Brand Sales Return PRD specifies three Gross Amount formula paths:
1. SGST+CGST > 0: `(GrossAmt / (1+(SGST+CGST)/100)) - CessAmt - TCSAmt`
2. IGST > 0: `(GrossAmt / (1+IGST/100)) - CessAmt - TCSAmt`
3. CGST+UTGST > 0: `(GrossAmt / (1+(CGST+UTGST)/100)) - CessAmt - TCSAmt`

Current `utils/dataUtils.js` `recalculateGrossAmount` only implements paths 1 and 2. CGST+UTGST path is **missing**.

**Why this matters:** Union Territory transactions (e.g., Chandigarh, Delhi NCT in some classifications) generate CGST+UTGST tax, not CGST+SGST. The adapter will silently store the raw (pre-tax) Gross Amount for these rows instead of the recalculated value, causing data integrity issues.

**How to apply:** When asked to extend `recalculateGrossAmount`, add the UTGST path as a third branch. Need to confirm: does the CSV have a `UTGST Perc` column, or is UTGST reusing the SGST column? This is an open ambiguity in the PRD — the field mapping table lists SGST but no UTGST column.

Also note: the current implementation formula differs from the PRD in a significant way. PRD says subtract CessAmt and TCSAmt. The actual `dataUtils.js` implementation subtracts `schmDisc` and adds `cgstAmt + sgstAmt` (or `igstAmt`). This divergence should be clarified with the dev team before writing new test cases that assert formula correctness.
