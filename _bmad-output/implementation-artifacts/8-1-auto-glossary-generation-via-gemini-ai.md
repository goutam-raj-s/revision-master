# Story 8.1: Auto-Glossary Generation via Gemini AI

**Epic:** Epic 8: AI Acceleration & Advanced Learning
**Status:** ready-for-dev

## User Story
As a **user**,
I want the system to automatically generate a terminology glossary for my submitted documents using Gemini AI,
So that I don't have to manually extract and type out key definitions.

## Acceptance Criteria

1. **Given** the user submits a new document or clicks "Generate Glossary"
2. **When** the Gemini API returns the analyzed terminology
3. **Then** the document's Terminology tab is populated with terms and definitions
4. **And** the user can bulk-accept, edit, or reject the AI suggestions
5. **And** if the Gemini API key is missing or invalid, a graceful prompt directs them to their settings

## Implementation Notes

- **AI Integration**: Use the Google Generative AI SDK (Gemini 1.5 Flash/Pro) on the server-side via a Next.js Server Action to parse the document content.
- **Context Size Limit**: Since Google Docs can be large, consider chunking or summarizing before passing it to Gemini to save costs, or rely on the 1M+ token limit of Gemini Pro.
- **Prompt Engineering**: The prompt must enforce a strict JSON output schema containing an array of `{ term: string, definition: string }` objects so it can be parsed natively into the MongoDB `Terminology` schema.
- **UI Interaction**: Add a spark/magic wand icon button on the Terminology tab. When clicked, switch to a loading state. Once returned, display a review list with checkboxes to save to DB.

## Dependencies
- Requires a valid Gemini API key stored in User settings (Story 1.6).
- Reuses the existing Terminology UI schema (Story 4.2).
