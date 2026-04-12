# Story 8.3: Built-in Pomodoro Focus Timer

**Epic:** Epic 8: AI Acceleration & Advanced Learning
**Status:** ready-for-dev

## User Story
As a **user**,
I want an integrated Pomodoro timer within the study workspace,
So that I can maintain structured focus without leaving the application.

## Acceptance Criteria

1. **Given** the user is in the Split-Screen Glass Modal
2. **When** they activate the focus timer
3. **Then** a countdown timer (default 25 minutes) starts and is displayed on screen
4. **And** an alarm/visual cue triggers when the time expires
5. **And** the timer persists correctly even if the user switches documents during a session

## Implementation Notes

- **Global State**: The timer needs to be lifted to global state (using Zustand, which is already configured in this project). This ensures that if the user dismisses a document modal and opens another one, the 25-minute Pomodoro session doesn't abruptly reset.
- **UI Element**: Add a minimal and elegant clock icon near the global header or right above the action side of the Study Workspace. Clicking pops over a small menu to Play/Pause/Stop the timer.
- **Audio/Visual API**: Use the browser `AudioContext` or a simple HTML5 `<audio>` element with a soft, non-jarring "ding" when the time completes. Follow `UX-DR1` to maintain the Zen theme (nothing loud or alarming).
- **Background Throttling**: Use `requestAnimationFrame` or Web Workers if precision is needed, since standard `setInterval` may be heavily throttled by the browser if the user tabs away. Since absolute precision isn't paramount for studying, standard interval tracking with timestamp calculation (`expectedEndTime - Date.now()`) on un-pause is best.

## Dependencies
- Zustand state management.
- shadcn/ui DropdownMenu or Popover for the timer controls.
