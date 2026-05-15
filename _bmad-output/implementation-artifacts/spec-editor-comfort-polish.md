---
title: 'Super Editor Convenience Pass'
type: 'feature'
created: '2026-05-16T00:00:00+05:30'
status: 'done'
context:
  - '{project-root}/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-advanced-editor-hierarchical-workspace.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The editor has powerful features, but the two main editor pages still feel like feature containers rather than a polished product: editing, studying, tabs, notes, terms, save state, and side panels all need small conveniences that make the app feel thoughtful.

**Approach:** Polish the existing `/documents/[docId]` and `/study/[docId]` experiences with lightweight, low-risk improvements: visible state, persistent preferences, better sidebars, search/copy controls, calmer editor styling, keyboard shortcuts, and richer context panels.

## Boundaries & Constraints

**Always:**
- Keep the current Tiptap editor, existing document save action, image upload action, and `CollapsibleImage` behavior.
- Keep autosave enabled, but report it through persistent UI state instead of repeated success toasts.
- Use existing Tailwind tokens, Radix primitives, Lucide icons, and local component patterns.
- Preserve keyboard shortcuts already documented in the project context.

**Ask First:**
- If changing persisted document data shape, introducing a new editor engine, or adding dependencies.

**Never:**
- Do not add onboarding copy blocks inside the editor canvas.
- Do not remove manual save, PDF export, image paste/drop, or existing highlight colors.
- Do not commit local recovery artifacts or generated duplicate trees.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Autosave while typing | User edits native document content | Footer shows unsaved/saving/saved state without firing success toast every time | Error state persists and shows toast only on failure |
| Manual save | User clicks Save or presses Cmd/Ctrl+S | Content saves immediately and shows success feedback | Error toast if save action fails |
| Focus writing | User toggles focus mode | Editor expands into a calmer, narrower writing surface and hides nonessential footer clutter | Toggle is reversible |
| Sticky highlight | User toggles toolbar sticky highlighter or uses shortcuts | Toolbar shows active color and sticky state | No-op if editor is unavailable |
| Drop image | User drags an image over editor | Drop zone visually responds and inserted image appears at drop point | Upload failure shows toast |

</frozen-after-approval>

## Code Map

- `src/components/features/editor/RichTextEditor.tsx` -- Editor shell, save state, drag/drop image flow, focus mode, status footer.
- `src/components/features/editor/EditorToolbar.tsx` -- Formatting controls, highlight palette, sticky highlight and focus toggles.
- `src/app/globals.css` -- Tiptap prose styling and editor interaction polish.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/features/editor/RichTextEditor.tsx` -- Replace noisy autosave toasts with persistent save state, word count, character count, reading time, focus mode state, and drag-over affordance.
- [x] `src/components/features/editor/EditorToolbar.tsx` -- Add visible sticky highlight controls, active color indicators, shortcut strip, and focus-mode toggle.
- [x] `src/app/globals.css` -- Improve editor prose spacing, selection, highlights, placeholder, tables, and long-form readability.
- [x] `src/components/features/study-split-pane.tsx` -- Add collapsible, persistent, keyboard-toggleable study panel with resettable width.
- [x] `src/components/features/study-sidebar-panel.tsx` -- Add search, compact mode, quick capture actions, metrics, copy controls, and remembered tab state.
- [x] `src/components/features/document-tabs-sidebar.tsx` -- Add remembered collapsed state, tab search, page count, and empty search state.
- [x] `src/components/features/document-detail-client.tsx` -- Add stats, search, and copy affordances for the document detail companion area.

**Implemented Lightweight Conveniences:**
1. Quiet autosave success behavior
2. Persistent save state label
3. Last-saved timestamp
4. Unsaved state label
5. Save-failed state label
6. Word count
7. Character count
8. Estimated reading time
9. Persistent focus mode preference
10. Toolbar focus toggle
11. `Cmd/Ctrl+Shift+F` focus shortcut
12. Image drag-over drop target
13. Cleanup of pending autosave timer on unmount
14. Sticky highlight toolbar state strip
15. Highlight shortcut hints
16. Active highlight swatch in toolbar
17. Sticky highlighter toggle inside color menu
18. Active color ring in highlight palette
19. Image URL insertion through collapsible image node
20. Grouped toolbar controls
21. Horizontal toolbar overflow for smaller widths
22. Calmer editor selection color
23. Softer placeholder styling
24. Better prose spacing
25. Better table styling
26. Better blockquote styling
27. Better inline code styling
28. Mobile editor typography tuning
29. Study panel collapse toggle
30. Persisted study panel open/closed state
31. Persisted study panel width
32. Study panel width reset
33. `Cmd/Ctrl+]` study panel shortcut
34. Remembered study sidebar tab
35. Study sidebar compact mode
36. Study sidebar search
37. Quick note composer action
38. Quick term composer action
39. Study overview metric cards
40. Note completion progress bar
41. Tag search/filter in study panel
42. Note search/filter in study panel
43. Term search/filter in study panel
44. Copy note action in study panel
45. Copy term action in study panel
46. Document tabs remembered collapse state
47. Document tabs search
48. Document tabs page count
49. Document tabs empty search state
50. Document detail stats cards
51. Document detail note/term search
52. Document detail copy note action
53. Document detail copy term action

**Acceptance Criteria:**
- Given the user types in a native document, when autosave runs, then the footer updates save state without repeatedly showing success toasts.
- Given sticky highlight is active, when the toolbar is visible, then the active color and sticky mode are obvious without memorizing shortcuts.
- Given an image is dragged over the editor, when it enters the writing canvas, then the editor shows a clear drop affordance.
- Given focus mode is toggled, when the user continues writing, then the editor surface feels calmer and remains fully reversible.

## Verification

**Commands:**
- `npm run build` -- expected: production build succeeds.
