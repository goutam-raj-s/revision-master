# Story 9.4: chrome-extension-clipper

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a Chrome Extension Web Clipper,
so that I can easily save the URL, Title, and my custom notes from any website directly into Revision Master.

## Acceptance Criteria

1. **Extension Skeleton:** There is an `extension/` directory at the project root containing a valid Manifest V3 `manifest.json`.
2. **Omnipresent Floating Icon (Browser-wide):** The extension injects a floating icon/button onto external webpages via a `content_script`. This persists across all tabs.
3. **Popup/Overlay UI:** Clicking the floating icon (or the extension toolbar icon) opens an overlay/popup with inputs for Title, URL (read-only), and Notes.
4. **Auto-capture:** The extension automatically populates the active tab's URL and Title into the form fields.
5. **In-App Global Widget:** Inside the Revision Master web app, there is a native global floating widget available on all pages that provides the same functionality. It is closable and restorable via a keyboard shortcut (e.g., `Cmd+Shift+K` or similar).
6. **Backend API:** The Next.js application exposes an endpoint (e.g., `POST /api/documents/clipper`) to accept the incoming payload.
7. **Submission Flow:** Submitting the form sends the data to the Next.js API, displaying a success state upon completion.
8. **Authentication:** The extension sends requests to the Next.js API securely (handling CORS and auth).

## Tasks / Subtasks

- [x] Task 1: Initialize Extension Architecture (AC: 1)
  - [x] Create `extension/` folder in the project root.
  - [x] Write `manifest.json` (V3) requesting `activeTab`, `tabs`, and `content_scripts` permissions.
- [x] Task 2: Build Floating Icon & Capture UI (AC: 2, 3, 4)
  - [x] Create `content.js` to inject the floating action button onto external pages.
  - [x] Build the overlay/popup UI (HTML/CSS/JS) to show the note-taking form.
  - [x] Auto-populate the active tab URL and Title.
- [x] Task 3: Build Next.js Backend Endpoint (AC: 6, 7, 8)
  - [x] Create an API route handler in `src/app/api/...` that accepts the JSON payload.
  - [x] Handle CORS / authentication so the extension can POST successfully.
  - [x] Save the incoming payload to the database.
- [x] Task 4: Build In-App Global Widget (AC: 5)
  - [x] Create a global floating React component in the Next.js layout.
  - [x] Implement a keyboard shortcut listener to toggle its visibility.
  - [x] Connect the widget to the same note-saving logic.

## Dev Notes

- **Architecture:** The extension is entirely frontend (HTML/CSS/Vanilla JS) running in the browser. It communicates with the existing Next.js backend via HTTP POST.
- **Constraints:** For local development, point the fetch URL to `http://localhost:3000/api/...`. 
- **CORS:** Ensure the Next.js API route accepts requests from the `chrome-extension://...` origin or handles credentials properly. Since it's an extension, Manifest V3 `host_permissions` for `http://localhost:3000/*` can bypass standard CORS.
- **Authentication Strategy:** Start by sending `credentials: 'include'` in the fetch request. If the user is logged into the local Next.js app, the session cookie *should* be passed. If this fails due to SameSite cookie policies, consider passing a token.

### Project Structure Notes

- `extension/` will sit at the root level, parallel to `src/` and `public/`. This keeps it version-controlled with the app.

### References

- User Discussion: Ad-hoc decision to build a Chrome extension to bypass iframe restrictions for generic website note-taking.

## Dev Agent Record

### Agent Model Used

Gemini 3.1 Pro (High)

### Debug Log References

### Completion Notes List

- Implemented Chrome Extension Web Clipper (Manifest V3) in `extension/` folder.
- Created `content.js` and `content.css` to inject a floating action button onto external webpages.
- Created `popup.html`, `popup.css`, and `popup.js` for the clipper interface.
- Built a Next.js API route `POST /api/documents/clipper` that accepts cross-origin requests and uses cookie-based authentication.
- Developed a native React component `GlobalClipperWidget` with a `Cmd+Shift+K` keyboard shortcut for in-app global clipping.
- Integrated the widget into the `(dashboard)/layout.tsx`.

### File List

- `extension/manifest.json` (New)
- `extension/popup.html` (New)
- `extension/popup.css` (New)
- `extension/popup.js` (New)
- `extension/content.js` (New)
- `extension/content.css` (New)
- `src/app/api/documents/clipper/route.ts` (New)
- `src/components/features/global-clipper-widget.tsx` (New)
- `src/app/(dashboard)/layout.tsx` (Modified)
