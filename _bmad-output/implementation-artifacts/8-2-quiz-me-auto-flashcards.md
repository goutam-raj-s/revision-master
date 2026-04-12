# Story 8.2: "Quiz Me" Auto-Flashcards

**Epic:** Epic 8: AI Acceleration & Advanced Learning
**Status:** ready-for-dev

## User Story
As a **user**,
I want the system to automatically generate active-recall questions from my assigned documents,
So that I can test my knowledge instead of passively re-reading.

## Acceptance Criteria

1. **Given** the user is viewing a document in the Split-Screen Glass Modal
2. **When** they enter "Quiz Me" mode
3. **Then** the AI dynamically generates 3-5 flashcard questions based on the document text
4. **And** the user can reveal the answers sequentially
5. **And** performance on the quiz influences the difficulty assigned to the document

## Implementation Notes

- **AI Generation**: Rely on the same Server Action mechanism via the Gemini SDK. The prompt should enforce a JSON output matching an interface of `Array<{ question: string, answer: string }>`.
- **UI Interaction**: Build a "Flashcard Carousel" component in React. Users flip the card to see the answer and select "Got it" vs "Struggled".
- **Spaced Repetition Integration**: Integrate the results explicitly with the scheduling logic. If a user struggles with the AI-generated questions, the document's next interval should shrink (falling back to a "+1 day" or "+2 day" window depending on the future SM-2 algorithm).
- **Transient State**: The AI questions shouldn't rigidly save as permanent objects immediately (to save DB space), but transient flashcards live in React state during the review session unless the user wants to "Save to notes."

## Dependencies
- Document retrieval logic.
- Story 8.1 architecture for safely invoking Gemini API Server Actions.
