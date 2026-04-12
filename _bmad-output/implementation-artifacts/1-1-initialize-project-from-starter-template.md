# Story 1.1: Initialize Project from Starter Template

Status: done

## Story

As a **developer**,
I want to initialize the Revision-Master project using the official Next.js starter with TypeScript, Tailwind, ESLint, App Router, and src directory,
so that I have a production-ready foundation optimized for Vercel deployment.

## Acceptance Criteria

1. Running `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` produces a working Next.js application that builds and runs.
2. The project structure includes `/src/app` with App Router layout.
3. TypeScript, Tailwind CSS, and ESLint are correctly configured.
4. Import alias `@/*` resolves correctly to `/src/*`.
5. A `.gitignore` suitable for Next.js is in place.
6. The directory structure follows the architecture spec: `/(admin)`, `/(auth)`, `/(dashboard)`, `/study/[docId]` route groups created as placeholders.

## Tasks / Subtasks

- [x] Task 1: Initialize Next.js project (AC: 1, 2, 3, 4, 5)
  - [x] 1.1: Run create-next-app command in the project root
  - [x] 1.2: Verify tsconfig.json has correct path alias `@/*` → `./src/*`
  - [x] 1.3: Verify tailwind.config.ts is present and configured
  - [x] 1.4: Verify ESLint config is present (eslint.config.mjs or .eslintrc)
- [x] Task 2: Scaffold App Router route groups (AC: 6)
  - [x] 2.1: Create `src/app/(admin)/layout.tsx` placeholder
  - [x] 2.2: Create `src/app/(auth)/layout.tsx` placeholder
  - [x] 2.3: Create `src/app/(dashboard)/layout.tsx` placeholder
  - [x] 2.4: Create `src/app/study/[docId]/page.tsx` placeholder
- [x] Task 3: Set up project folder structure per architecture spec (AC: 2)
  - [x] 3.1: Create `src/components/ui/` directory
  - [x] 3.2: Create `src/components/features/` directory
  - [x] 3.3: Create `src/lib/db/` directory
  - [x] 3.4: Create `src/lib/srs/` directory
  - [x] 3.5: Create `src/lib/auth/` directory
  - [x] 3.6: Create `src/actions/` directory
  - [x] 3.7: Create `src/store/` directory

## Dev Notes

- **Architecture:** [Source: _bmad-output/planning-artifacts/architecture.md]
  - Project initialized via official `create-next-app@latest` — NOT a community boilerplate
  - Must use `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` flags
  - The existing `_bmad`, `_bmad-output`, `docs` directories must be preserved (not deleted)
  - Vercel deployment target — App Router is the right choice

- **Project Structure:**
  ```
  /src
    /app
      /(admin)     # Role-gated admin panel
      /(auth)      # Login/Signup
      /(dashboard) # Main user study queue
      /study/[docId]  # Focus Mode
    /components
      /ui          # Base elements
      /features    # Complex components
    /lib
      /db          # MongoDB singleton
      /srs         # SRS algorithms
      /auth        # Custom session auth
    /actions       # Server Actions
    /store         # Zustand stores
  ```

- **create-next-app quirk:** The command was run in `/tmp/revision-master` because `create-next-app` rejected capital letters in the project name when run in place. Files were then copied to the project root.

- **next.config.ts:** Updated to use `remotePatterns` instead of the deprecated `domains` key for image optimization configuration.

- **Testing:** No test framework in this story — `npm run build` serves as the acceptance test.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure (App Router)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- `create-next-app` rejected capital letters in the project name when run in-place; workaround was to scaffold in `/tmp/revision-master` and copy files to project root.
- `next.config.ts` had deprecated `domains` key for image config; updated to `remotePatterns`.

### Completion Notes List
- Scaffolded Next.js 16 project with TypeScript, Tailwind v4, ESLint, App Router, and `src/` directory layout.
- Copied scaffold output from `/tmp/revision-master` to project root, preserving existing `_bmad-output/`, `docs/`, and `.git/` directories.
- Created route group placeholder layouts: `(admin)`, `(auth)`, `(dashboard)`.
- Created `src/app/study/[docId]/page.tsx` placeholder for Focus Mode route.
- Created all required `src/lib/`, `src/actions/`, `src/store/`, `src/components/ui/`, and `src/components/features/` directories.
- Updated `next.config.ts` to use `remotePatterns` for image configuration.
- Confirmed `npm run build` passes cleanly.

### File List
- `package.json` — project dependencies and scripts
- `tsconfig.json` — TypeScript config with `@/*` path alias
- `next.config.ts` — Next.js config with `remotePatterns`
- `tailwind.config.ts` — Tailwind v4 configuration
- `eslint.config.mjs` — ESLint flat config for Next.js
- `.gitignore` — standard Next.js gitignore
- `src/app/layout.tsx` — root layout with metadata
- `src/app/page.tsx` — root landing page placeholder
- `src/app/globals.css` — global Tailwind base styles
- `src/app/(auth)/layout.tsx` — auth route group layout placeholder
- `src/app/(auth)/login/page.tsx` — login page placeholder
- `src/app/(auth)/register/page.tsx` — register page placeholder
- `src/app/(dashboard)/layout.tsx` — dashboard route group layout placeholder
- `src/app/(admin)/layout.tsx` — admin route group layout placeholder
- `src/app/study/[docId]/page.tsx` — Focus Mode dynamic route placeholder
- `src/types/index.ts` — shared TypeScript type definitions
- `src/lib/utils.ts` — utility helpers (cn, etc.)

### Change Log
- Initialized project using `create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint, src directory, and `@/*` import alias.
- Updated `next.config.ts`: replaced deprecated `domains` with `remotePatterns`.
- Scaffolded all route group directories and placeholder pages per architecture spec.

## Story DoD Review

### Review Date
2026-04-11

### Reviewer
claude-sonnet-4-6 (autonomous)

### AC Verification
- **AC1:** PASS — `npm run build` completes without errors; scaffold produced a working Next.js application.
- **AC2:** PASS — `/src/app` directory exists with App Router `layout.tsx` at root and within each route group.
- **AC3:** PASS — `tsconfig.json`, `tailwind.config.ts`, and `eslint.config.mjs` all present and correctly configured.
- **AC4:** PASS — `tsconfig.json` contains `"@/*": ["./src/*"]` path mapping; confirmed resolves in build.
- **AC5:** PASS — `.gitignore` generated by `create-next-app` covers `node_modules`, `.next`, `.env*.local`, etc.
- **AC6:** PASS — `(admin)`, `(auth)`, `(dashboard)` route group layouts and `study/[docId]/page.tsx` all created.

### Review Outcome
PASS

### Review Notes
All acceptance criteria met. One notable deviation from the original plan: `create-next-app` was run in a temp directory due to capital-letter rejection, then files were copied over — this is a harmless workaround with no impact on the final project structure. The `next.config.ts` fix (remotePatterns vs domains) is an improvement over what the scaffold would have left. Build passes cleanly; foundation is solid for subsequent stories.
