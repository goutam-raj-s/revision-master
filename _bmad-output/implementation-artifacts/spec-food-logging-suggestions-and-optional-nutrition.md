---
title: 'Food logging suggestions and optional nutrition'
type: 'feature'
created: '2026-08-30'
status: 'done'
route: 'one-shot'
---

# Food logging suggestions and optional nutrition

## Intent

**Problem:** The food quick-add row had limited space with no way to reach older saved foods, and food entries required calorie data even when the user only knew the dish and amount.

**Approach:** Keep the most recent saved foods as fast chips, move the remaining saved foods into an Others dropdown, and make nutrition fields optional while adding fat tracking beside protein and carbs.

## Suggested Review Order

**Food Entry UX**

- Start with the visible quick-add row and remaining-food dropdown.
  [`calories-client.tsx:1330`](../../src/components/features/calories-client.tsx#L1330)

- Confirm the form exposes optional kcal, protein, carbs, and fat fields.
  [`calories-client.tsx:1413`](../../src/components/features/calories-client.tsx#L1413)

- Check repeat-food autofill keeps all known nutrition values.
  [`calories-client.tsx:706`](../../src/components/features/calories-client.tsx#L706)

**Validation And Storage**

- Confirm only dish name and quantity are required for food save.
  [`calories.ts:87`](../../src/actions/calories.ts#L87)

- Confirm add/update paths persist optional fat and blank nutrition safely.
  [`calories.ts:336`](../../src/actions/calories.ts#L336)

- Confirm serialized calorie records include fat fields.
  [`collections.ts:422`](../../src/lib/db/collections.ts#L422)

**Reporting**

- Confirm daily summaries aggregate fat with protein and carbs.
  [`calories.ts:217`](../../src/actions/calories.ts#L217)

- Confirm daily reports and CSV export include fat.
  [`calories-client.tsx:968`](../../src/components/features/calories-client.tsx#L968)

**Types**

- Confirm public calorie types include optional fat fields.
  [`index.ts:540`](../../src/types/index.ts#L540)
