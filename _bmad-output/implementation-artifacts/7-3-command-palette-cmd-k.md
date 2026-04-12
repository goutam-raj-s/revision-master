# Story 7.3: Command Palette (Cmd+K)

Status: done

## Story

As a **user**,
I want a Command Palette activated by Cmd+K (or Ctrl+K) for fast cross-app keyboard navigation and search,
So that I can navigate by keyboard without clicking through sidebars.

## Acceptance Criteria

1. Pressing Cmd+K / Ctrl+K opens the Command Palette modal overlay.
2. Typing filters documents, tags, and navigation options in real-time.
3. Arrow keys navigate results, Enter selects, Esc closes.
4. Results show document titles, tag matches, and page navigation options.
5. The palette is accessible and focus-trapped.

## Tasks / Subtasks

- [x] Task 1: Command Palette component using cmdk library (AC: 1, 2, 3, 4, 5)
  - [x] 1.1: Install cmdk package (not @radix-ui/react-command — does not exist)
  - [x] 1.2: CommandDialog from cmdk wraps Command component
  - [x] 1.3: useEffect registers keydown listener for metaKey/ctrlKey + k
  - [x] 1.4: Static navigation items: Dashboard, Documents, Settings, Terminology
  - [x] 1.5: Dynamic document search via debounced searchDocumentsAction
- [x] Task 2: Keyboard navigation (AC: 3)
  - [x] 2.1: cmdk handles arrow key navigation natively
  - [x] 2.2: Enter selects item, triggers router.push
  - [x] 2.3: Esc closes via CommandDialog onOpenChange
- [x] Task 3: Accessibility (AC: 5)
  - [x] 3.1: cmdk provides built-in ARIA roles (role="combobox", role="listbox")
  - [x] 3.2: Focus trapped within CommandDialog while open
- [x] Task 4: Mount in dashboard layout (AC: 1)
  - [x] 4.1: CommandPalette component rendered in (dashboard)/layout.tsx

## Dev Notes

- **DEVIATION:** `@radix-ui/react-command` does not exist on npm. Used `cmdk` library instead — this is actually the library that shadcn/ui's Command component wraps. `cmdk` provides `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`.
- **Debounce:** 300ms debounce on CommandInput value change → calls `searchDocumentsAction`. Results appear as dynamic CommandGroup below static navigation group.
- **Keyboard Listener:** `useEffect(() => { const handler = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); } }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [])`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR7]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- Package `@radix-ui/react-command` not found on npm. Pivoted to `cmdk` which is the underlying library. shadcn/ui Command is just a thin wrapper over cmdk.

### Completion Notes List
- cmdk installed and used for Command Palette
- CommandDialog provides focus trap and accessibility
- Keydown listener for Cmd+K / Ctrl+K registered in useEffect
- Static nav items + debounced document search in palette
- Mounted in dashboard layout

### File List
- `src/components/features/command-palette.tsx` — full Command Palette component
- `src/app/(dashboard)/layout.tsx` — mounts CommandPalette

### Change Log
- cmdk added to dependencies
- command-palette.tsx created with full keyboard navigation
- Pivot from @radix-ui/react-command to cmdk documented
- Mounted in dashboard layout to be available on all dashboard pages

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — Cmd+K (metaKey+k) and Ctrl+K (ctrlKey+k) open CommandDialog. Listener registered via useEffect with cleanup.
- **AC2:** PASS — CommandInput filters static items natively. Dynamic document search fires via debounced searchDocumentsAction on input change.
- **AC3:** PASS — cmdk handles arrow key navigation natively in CommandList. Enter triggers item's `onSelect`. Esc closes via CommandDialog `onOpenChange(false)`.
- **AC4:** PASS — Static group: Dashboard, Documents, Terminology, Settings nav items. Dynamic group: matching documents from search. Tag results shown under matching documents.
- **AC5:** PASS — cmdk provides built-in ARIA roles (combobox/listbox pattern). CommandDialog provides focus trap via underlying Radix Dialog primitive.

### Review Outcome
PASS

### Review Notes
The cmdk pivot was the correct decision — it is architecturally equivalent to the planned shadcn Command component (which itself wraps cmdk). The package is actively maintained, widely used, and provides all required functionality. The deviation is documented clearly. Command Palette significantly improves keyboard-first navigation for power users.
