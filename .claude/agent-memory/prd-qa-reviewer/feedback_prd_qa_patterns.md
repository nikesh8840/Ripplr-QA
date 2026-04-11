---
name: Recurring PRD Quality Gaps in CDMS Adapter PRDs
description: Patterns of missing or ambiguous requirements that appear repeatedly across CDMS adapter PRDs — flag these proactively in every review
type: feedback
---

Flag these in every adapter PRD review:

1. **Reason field without CDMS mapping** — PRDs often introduce fields with "no validation" and no target table but never state whether the field is stored, discarded, or triggers a warning. Always ask: is it persisted, and if so, where?

2. **Lookup failure rollback behavior undefined** — PRDs describe "create new store / create new product" on lookup miss but never define what happens if the create call itself fails (duplicate key, missing required fields). Flag for every store/product auto-create requirement.

3. **Partial file failure handling** — PRDs describe per-row validations but don't specify whether the entire file is rejected on any error (fail-fast) or whether valid rows are processed and invalid rows are reported separately (partial success). This is critical for bulk return adapters.

4. **New DB column schema not specified** — PRDs like Marico add a new column (e.g., brand_return.Return_no for SalesReturnNo) but don't specify nullable/non-nullable, default value, max length at DB level. Test cases must cover nullability and overflow.

5. **CGST+UTGST tax path** — Union Territory transactions require CGST+UTGST formula, not CGST+SGST. Every GST-related adapter PRD should be checked for UTGST coverage. If the field mapping table has no UTGST column, flag as ambiguity.

**How to apply:** At the start of every PRD review, check each of these five patterns against the requirements. If any are missing, include them in the Ambiguities & Clarifying Questions section.
