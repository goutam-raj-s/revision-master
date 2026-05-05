---
title: 'Add Tags and Terminology to Clipper'
type: 'feature'
created: '2026-05-06T03:21:00+05:30'
status: 'done'
baseline_commit: 'ae481f86837bfbf2f995e3d8fc700fb50c9d8d66'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The recently built Chrome Extension Web Clipper and In-App Global Widget only support saving Title, URL, and Notes. Users need the ability to add Tags and Terminology directly when clipping to fully categorize their knowledge without needing to revisit the app later.

**Approach:** Extend the Clipper forms (both extension popup and in-app widget) to include inputs for "Tags" (comma-separated string) and "Terminology" (as a textarea or input pairs, e.g. `Term: Definition`). Update the Next.js API endpoint `POST /api/documents/clipper` to parse the tags string into the document's `tags` array, and parse the terminology input to insert records into the `terms` collection linked to the newly created document.

## Boundaries & Constraints

**Always:**
- Use the existing `terms` collection and schema for storing terminology.
- Split comma-separated tags and trim whitespace before saving to the document `tags` array.

**Ask First:**
- If changing the schema of the `terms` collection or existing API return types.

**Never:**
- Never break the existing functionality of creating a Document, Repetition, or Note when clipping.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Submit clip with Tags | `tags="react, chrome extension"` | Document is created with `tags: ["web-clip", "react", "chrome extension"]` | N/A |
| Submit clip with Terminology | `terminology="API: Application Programming Interface"` | A `Term` record is created with `term="API"` and `definition="Application Programming Interface"` | Skip malformed lines silently or add as Notes |

</frozen-after-approval>

## Code Map

- `extension/popup.html` -- Needs new input fields for Tags and Terminology.
- `extension/popup.js` -- Needs to extract values from new fields and include in payload.
- `src/components/features/global-clipper-widget.tsx` -- Needs new input fields for Tags and Terminology and include in payload.
- `src/app/api/documents/clipper/route.ts` -- Needs to parse `tags` and `terminology` from the payload, update the Document insertion, and insert into the `terms` collection.

## Tasks & Acceptance

**Execution:**
- [x] `extension/popup.html` -- Add an input for Tags (comma-separated) and a textarea for Terminology (Format: `Term: Definition`).
- [x] `extension/popup.js` -- Extract `tags` and `terminology` values and append them to the `payload`.
- [x] `src/components/features/global-clipper-widget.tsx` -- Add matching input fields for Tags and Terminology and update the `payload`.
- [x] `src/app/api/documents/clipper/route.ts` -- Update `ClipperPayloadSchema` to accept `tags` and `terminology`. Parse `tags` to append to the document's `tags` array. Parse `terminology` line by line, split by `:` to extract terms and definitions, and insert them into the `terms` collection via `getTermsCollection()`.

**Acceptance Criteria:**
- Given the Web Clipper is open, when a user enters "react, frontend" in the Tags field and "CORS: Cross-Origin Resource Sharing" in the Terminology field, then the document is saved with those tags, and a terminology record is created for "CORS".

## Spec Change Log

## Design Notes

Terminology parsing:
Allow users to enter terminology in a textarea like so:
```
CORS: Cross-Origin Resource Sharing
API: Application Programming Interface
```
The API route splits by `\n` and then by `:` to separate the term and definition. If no `:` is found, ignore or gracefully handle.

## Verification

**Manual checks (if no CLI):**
- Open the extension or the in-app widget, fill out all fields including Tags and Terminology, and submit.
- Verify in the MongoDB database (or via the app UI) that the Tags were added to the Document and the Terminology records appear in the Terminology page.

## Suggested Review Order

**Backend API**

- Process tags and terminology input, inserting terms into the database.
  [`route.ts:54`](../../src/app/api/documents/clipper/route.ts#L54)
  
- Insert terminology lines as individual Term records.
  [`route.ts:96`](../../src/app/api/documents/clipper/route.ts#L96)

**Extension UI**

- Add Tags and Terminology inputs to the extension HTML form.
  [`popup.html:28`](../../extension/popup.html#L28)
  
- Extract new fields and include in extension payload.
  [`popup.js:50`](../../extension/popup.js#L50)
  
- Make extension popup and iframe natively resizable.
  [`popup.css:12`](../../extension/popup.css#L12)
  
  [`content.css:26`](../../extension/content.css#L26)

**In-App Widget**

- Add inputs to the global widget form and handle parsing.
  [`global-clipper-widget.tsx:128`](../../src/components/features/global-clipper-widget.tsx#L128)
  
- Enable standard browser resizing for the widget container.
  [`global-clipper-widget.tsx:90`](../../src/components/features/global-clipper-widget.tsx#L90)
