# UX & Convenience Practices Log

The following is a curated list of modern UX convenience practices implemented across the **lostbae** application to ensure a high-profile, professional user experience.

## 1. Global Navigation & Layout
- **Clickable Brand Logo**: The sidebar logo links directly to the `/dashboard` (homepage), allowing users to return home from anywhere in the app instantly.
- **Global Command Palette (`⌘K`)**: Users can trigger the search and command palette from anywhere using the standard `⌘K` keyboard shortcut.
- **Responsive Navigation**: The sidebar automatically collapses into a hamburger menu on mobile devices. Tapping outside the mobile menu (on the backdrop overlay) safely closes it.
- **Active Navigation States**: Sidebar links dynamically highlight based on the current active route, providing immediate context of where the user is.

## 2. Forms & Inputs
- **Auto-focus on Primary Inputs**: High-intent forms (like the "Add Document" or "Add Video" forms) use `autoFocus` on their primary input. Users can paste URLs immediately upon navigating to the page without needing an extra click.
- **Clearable Search Bars**: Search inputs feature a contextual `X` clear button that only appears when text is present, allowing users to wipe queries in one click.
- **Submit on Enter**: All forms natively support hitting the `Enter` key to trigger submission.
- **Inline Validation**: Forms validate inputs (like URL formatting) on blur and display inline, contextual error messages in red without wiping the user's existing input.

## 3. Interactive Feedback & States
- **Disabled Loading States**: Submit buttons disable themselves and show a spinning `Loader2` icon when a request is pending. This prevents accidental double-submissions.
- **Toast Notifications**: Non-blocking toast notifications appear at the bottom of the screen to confirm successes (e.g., "Document deleted", "Review complete") or surface errors.
- **Bouncy Hover Micro-interactions**: Buttons and interactive cards feature a `bouncy-hover` scale animation, making the interface feel alive and tactile.
- **Tooltips for Icon-only Buttons**: Actions that rely on icons (like the Trash icon or the BookOpen study icon) are wrapped in `SimpleTooltip` components so users don't have to guess their function.

## 4. Safety & Fallbacks
- **Destructive Action Confirmations**: Clicking "Delete" does not immediately delete the document. It opens a Dialog modal with a clear warning that the action is irreversible, preventing accidental data loss.
- **Graceful Empty States**: If a user's queue is empty, or a search yields no results, the app displays a friendly `<InboxZero />` or empty state graphic with a clear Call-To-Action (e.g., "Add your first document").
- **Graceful Error Boundaries**: If a server action fails, an error alert block slides down inside the form, rather than crashing the page or redirecting to an error screen.

## 5. Performance UX
- **Background Prefetching**: High-priority navigation links (like "Add Document") use `prefetch={true}` so the next page is loaded in the background, making the transition instantaneous.
- **Deferred Heavy UI (Code-splitting)**: Massive UI components like the `RichTextEditor` and `PDFAnnotator` are lazy-loaded, ensuring the rest of the page remains interactive immediately while the heavy chunks download in the background.
