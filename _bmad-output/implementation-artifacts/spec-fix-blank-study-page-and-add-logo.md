---
title: 'Fix blank study page & add brand logo'
type: 'bugfix'
created: '2026-05-04T03:26:00+05:30'
status: 'done'
baseline_commit: '86ffbf86912d860123cc3833f90512b3455f87fe'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Internally created documents show a blank white page on the `/study/` route because they have a `mediaType` of `native-doc` which falls back to an iframe renderer that doesn't support the `native://` URL scheme. Additionally, the new `lostbae` brand logo is not visible on pages where the sidebar is hidden (e.g., the study view), making it hard to navigate back to the dashboard.

**Approach:** 
1. Update `StudySplitPane` usage in `src/app/study/[docId]/page.tsx` to handle `doc.mediaType === "native-doc"` by rendering `doc.content` using `dangerouslySetInnerHTML` within a styled `prose` container.
2. Update `DashboardHeader` to replace the generic `Home` icon with the `HeartHandshake` brand logo. Add an optional `showLogo` prop that, when true, also displays the "lostbae" text. Pass this prop from `StudyPage` so the full logo is visible when the sidebar is not present.

## Boundaries & Constraints

**Always:** Ensure XSS safety isn't degraded. The `doc.content` comes from the internal rich text editor, but it should be rendered carefully. Preserve the existing `DashboardHeader` spacing and responsive layout.

**Ask First:** If changing the layout of `DashboardHeader` causes overflow or spacing issues with long document titles in the breadcrumb.

**Never:** Do not add a second `Sidebar` to the `StudyPage`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| View internal document | `doc.mediaType === "native-doc"` | Renders HTML content in a scrollable `prose` container | N/A |
| View external document | `doc.mediaType === "document"` | Renders existing iframe or player | N/A |
| View StudyPage | `DashboardHeader` with `showLogo={true}` | Logo icon and "lostbae" text appear in header | N/A |
| View Dashboard | `DashboardHeader` default | Only `HeartHandshake` icon appears (replacing Home) | N/A |

</frozen-after-approval>

## Code Map

- `src/app/study/[docId]/page.tsx` -- Update media type branching to render `native-doc` and pass `showLogo={true}` to `DashboardHeader`.
- `src/components/features/dashboard-header.tsx` -- Update to import and use `HeartHandshake` instead of `Home`, and conditionally show brand text based on `showLogo` prop.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/features/dashboard-header.tsx` -- Add `showLogo` prop, replace `Home` with `HeartHandshake`, conditionally render `<span className="font-bold ...">lostbae</span>`.
- [x] `src/app/study/[docId]/page.tsx` -- Pass `showLogo={true}` to `DashboardHeader`. Add `doc.mediaType === "native-doc"` branch in `leftContent` rendering `dangerouslySetInnerHTML={{ __html: doc.content || "" }}`.

**Acceptance Criteria:**
- Given an internally created document, when visiting its study page, then its rich text content is rendered instead of a blank white iframe.
- Given the study page, when viewing the top header, then the full `lostbae` logo is visible and clickable to return to the dashboard.
- Given the dashboard, when viewing the top header, then a `HeartHandshake` icon is visible as the home button.

## Verification

**Commands:**
- `npm run lint` -- expected: No TypeScript or ESLint errors.

**Manual checks (if no CLI):**
- Verify that opening an internally created document correctly displays its content on the left side of the study page.
- Verify that the brand logo in the study page header is vertically aligned with the breadcrumbs.

## Suggested Review Order

- Expose logo via DashboardHeader with a conditional 'showLogo' prop
  [`dashboard-header.tsx:3`](../../src/components/features/dashboard-header.tsx#L3)

- Handle native documents and enable the logo
  [`page.tsx:39`](../../src/app/study/[docId]/page.tsx#L39)
