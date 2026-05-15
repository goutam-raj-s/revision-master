# Project Context: lostbae

## Project Overview
lostbae is an "active intelligence layer" for unstructured knowledge (primarily Google Docs). It uses Spaced Repetition (SRS), AI-driven terminology extraction (Gemini), and a premium "Zen Productivity" UI to ensure users consolidate and recall their scattered insights.

## Core Technology Stack
- **Framework:** Next.js 14+ (App Router, Server Actions, RSC)
- **Database:** MongoDB (Native Driver, Singleton Pattern)
- **Authentication:** Supabase Auth (OAuth + Credentials)
- **Editor:** Tiptap (Custom extensions for Highlighting and Collapsible Images)
- **Styling:** Tailwind CSS + Radix UI (Lucide Icons)
- **AI:** Gemini API (terminology, summarization)
- **Cloud Media:** Cloudinary (with Base64 fallback)

## Key Technical Patterns & Rules

### 1. Document Management
- **Hierarchy:** Documents use a `parentDocId` field for sub-page nesting.
- **Sidebar:** The `DocumentTabsSidebar` is the primary navigation for sub-pages.
- **Collapsible Layout:** The main sidebar (`Sidebar`) supports `expanded`, `mini`, and `hidden` states.

### 2. Rich Text Editor (Tiptap)
- **Fluid Typography:** Uses CSS `clamp()` in `globals.css` for responsive text.
- **Sticky Highlighter:** Triggered by `Cmd+Shift+H`. Supports multiple colors.
- **Collapsible Images:**
    - Standard `img` tags are converted to `CollapsibleImage` badges.
    - **Hover**: Shows preview (auto-hides).
    - **Double-Click**: Expands to resizable block.
    - **Overlay**: Includes "Copy to Clipboard" button.
- **Command Palette:** Triggered by `Cmd + /`.

### 3. Data Flow
- **Server Actions:** Use for all mutations.
- **Caching:** Use `revalidateTag()` for surgical UI updates.
- **Media Fallback:** If `CLOUDINARY_*` env vars are missing, system MUST fallback to Base64 in `uploadImageAction`.

## Implementation Principles
- **Zen Aesthetics:** Follow "Mint Tint" theme (Sage/Mint cream background, pristine white cards).
- **Frictionless Ingestion:** Minimize clicks for adding URLs.
- **Tactile Feedback:** Use bouncy transforms (`cubic-bezier(0.34, 1.56, 0.64, 1)`) and smooth sweep animations.

## Repository Structure
- `src/actions`: Server Actions (mutations)
- `src/components/features/editor`: Tiptap implementation & extensions
- `src/lib/db`: MongoDB connection logic
- `_bmad-output/planning-artifacts`: Source of truth for PRD, Architecture, and Epics.
