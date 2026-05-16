---
title: 'Advanced Editor and Hierarchical Workspace'
type: 'feature'
created: '2026-05-16T00:00:00+05:30'
status: 'done'
baseline_commit: '270f2cd'
context:
  - '../planning-artifacts/prd.md'
  - '../planning-artifacts/architecture.md'
  - '../planning-artifacts/epics.md'
  - '../planning-artifacts/ux-design-specification.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The document experience needs to evolve from a simple editor into a focused knowledge workspace. Users need nested document pages, richer highlighting workflows, and image annotations that preserve reading flow instead of turning notes into large media stacks.

**Approach:** Add a Phase 1.7 feature slice that combines hierarchical document navigation, multicolor/sticky highlighting, paste/drop image ingestion, and a custom Tiptap `CollapsibleImage` node. Update planning artifacts so the PRD, architecture, epics, and UX design all describe the same feature set.

## Boundaries & Constraints

**Always:**
- Use the existing MongoDB `documents.parentDocId` hierarchy for sub-pages.
- Keep editor mutations in Server Actions where possible.
- Store uploaded images through Cloudinary when configured, with a Base64 data URL fallback for local/dev environments.
- Preserve editor reading flow by rendering inserted images as compact inline badges by default.
- Use existing design tokens, Radix primitives, Lucide icons, and Tiptap extension patterns.

**Ask First:**
- If introducing a dedicated media collection or changing the persisted document schema beyond existing optional document fields.
- If replacing Tiptap image behavior in a way that might break existing saved native-doc content.

**Never:**
- Never require Cloudinary credentials for local image insertion to work.
- Never block the editor on a media upload failure without showing a toast.
- Never remove the existing manual save/autosave behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Create sub-page | User clicks `+` in document tabs sidebar | Server creates a native child document with `parentDocId`; user navigates to it | Toast error if creation fails |
| Delete active sub-page | User deletes current tab | Page is deleted, related records are cascaded by existing delete action, user is redirected to another tab or `/documents` | Confirm before delete |
| Pick highlight color | User opens toolbar highlighter popover and chooses a swatch | Selected text receives that highlight color | Clear button removes highlight |
| Sticky highlight toggle | User presses `Cmd/Ctrl+Shift+H` | Sticky highlight toggles with yellow as default | Toast communicates on/off state |
| Sticky color shortcut | User presses `Cmd/Ctrl+Shift+P/O/I` | Sticky highlight turns on with pink/orange/red | No-op if editor is not mounted |
| Paste image | Clipboard contains an image | Image uploads and inserts as a collapsed image badge | Toast error if upload fails |
| Drop image | Dragged file is an image | Image uploads and inserts at drop coordinates | Ignore non-image files |
| Cloudinary unavailable | `CLOUDINARY_*` env vars are missing | Upload action returns Base64 data URL fallback | Warn server-side; editor still inserts image |
| Hover collapsed image | Image badge is collapsed | Tooltip preview opens with a larger image | Preview disappears on unhover |
| Expand image | User double-clicks badge | Image becomes an expanded resizable block | Existing node attrs are preserved |
| Copy image | User clicks image overlay Copy | Image blob is written to clipboard | Toast error if browser blocks clipboard |
| Resize image | User drags resize handle | Width attr updates live and is saved in editor content | Width tooltip shows current px value |

</frozen-after-approval>

## Code Map

- `src/components/features/document-tabs-sidebar.tsx` - New client component for document sub-page navigation, creation, deletion, and collapsed sidebar state.
- `src/actions/documents.ts` - Provides `createSubPageAction(parentDocId, title)` for child native document creation.
- `src/components/features/editor/EditorToolbar.tsx` - Adds Radix popover-backed highlighter palette with six color swatches and clear action.
- `src/components/ui/popover.tsx` - Adds local Popover wrapper around `@radix-ui/react-popover`.
- `src/components/features/editor/RichTextEditor.tsx` - Wires sticky highlight shortcuts, paste/drop image upload, and the custom image node.
- `src/components/features/editor/extensions/CollapsibleImage.tsx` - Custom Tiptap node and React node view for collapsed badges, hover previews, expanded image blocks, copy, delete, and resizing.
- `src/actions/upload.ts` - Server Action for Cloudinary image upload with Base64 fallback.
- `project-context.md` - Captures current project conventions for future agents.
- `_bmad-output/planning-artifacts/*.md` - Updates PRD, architecture, epics, and UX design with Phase 1.7 scope.

## Tasks & Acceptance

**Execution:**
- [x] Add Phase 1.7 requirements to the PRD.
- [x] Add hierarchy and media handling notes to the architecture artifact.
- [x] Add Epic 9 stories for advanced editor and hierarchical workspace.
- [x] Add UX patterns for document tree navigation and collapsible image annotations.
- [x] Add `DocumentTabsSidebar` for sub-page navigation and creation.
- [x] Add `createSubPageAction` for child native documents.
- [x] Add a reusable Radix Popover UI primitive.
- [x] Extend the editor toolbar with six highlight color presets and clear action.
- [x] Add sticky highlight shortcuts and click behavior to `RichTextEditor`.
- [x] Add image paste/drop upload flow through `uploadImageAction`.
- [x] Add `CollapsibleImage` Tiptap extension for image badges, previews, expansion, copy, delete, and resize.
- [x] Add `project-context.md` to document repository patterns and feature conventions.

**Acceptance Criteria:**
- Given a document has sub-pages, when the document tabs sidebar renders, then each sub-page appears as a navigable tab with active-state styling.
- Given the user clicks the sidebar `+`, when creation succeeds, then a child native document is created and the user is routed to it.
- Given highlighted text is selected, when a toolbar swatch is clicked, then that color is applied.
- Given sticky highlight is enabled, when the user clicks editor text, then the active highlight color is applied.
- Given an image is pasted or dropped into the editor, when upload succeeds, then a compact inline image badge appears in the document.
- Given the badge is hovered, then a preview appears without changing document layout.
- Given the badge is double-clicked, then it expands to a resizable image block with hover controls.
- Given Cloudinary is not configured, when an image is inserted, then the Base64 fallback still allows the image to render.

## Design Notes

**Highlight colors:**
- Yellow `#fef08a`
- Pink `#fbcfe8`
- Orange `#fed7aa`
- Red `#fecaca`
- Blue `#bfdbfe`
- Green `#bbf7d0`

**Keyboard shortcuts:**
- `Cmd/Ctrl+Shift+H` toggles sticky highlight with yellow.
- `Cmd/Ctrl+Shift+P` enables sticky pink.
- `Cmd/Ctrl+Shift+O` enables sticky orange.
- `Cmd/Ctrl+Shift+I` enables sticky red.

**Image behavior:**
- Collapsed state is the default to protect reading density.
- Hover preview is transient and uses tooltip behavior.
- Expanded state exposes copy, collapse, delete, and resize controls only on hover.

## Verification

**Commands:**
- `npm run build` - expected: 0 errors.

**Manual checks:**
- Create a sub-page from the document tabs sidebar and verify navigation.
- Apply each toolbar highlight color to selected text.
- Toggle sticky highlight and verify click-to-highlight behavior.
- Paste and drop an image into the editor with Cloudinary configured and without Cloudinary configured.
- Hover, expand, resize, copy, collapse, and delete an inserted image.

## Suggested Review Order

**Planning Artifacts**

- Confirm Phase 1.7 scope in PRD, architecture, epics, and UX specs.
  [`prd.md`](../planning-artifacts/prd.md)
  [`architecture.md`](../planning-artifacts/architecture.md)
  [`epics.md`](../planning-artifacts/epics.md)
  [`ux-design-specification.md`](../planning-artifacts/ux-design-specification.md)

**Editor**

- Review keyboard handling, upload insertion, and custom image extension wiring.
  [`RichTextEditor.tsx`](../../src/components/features/editor/RichTextEditor.tsx)

- Review image node view interactions and persistence attributes.
  [`CollapsibleImage.tsx`](../../src/components/features/editor/extensions/CollapsibleImage.tsx)

**Server Actions**

- Review upload fallback behavior and child document creation.
  [`upload.ts`](../../src/actions/upload.ts)
  [`documents.ts`](../../src/actions/documents.ts)

**UI Primitives**

- Review highlight popover and document tabs sidebar behavior.
  [`EditorToolbar.tsx`](../../src/components/features/editor/EditorToolbar.tsx)
  [`document-tabs-sidebar.tsx`](../../src/components/features/document-tabs-sidebar.tsx)
  [`popover.tsx`](../../src/components/ui/popover.tsx)
