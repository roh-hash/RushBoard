# RushBoard

Real-time web app for managing fraternity rush. Rushees check in via QR code; members rate, comment, and vote on bids — all live across every phone in the room.

## Project state

**Phase:** MVP complete. Now entering frontend design/polish phase.
**Scope right now:** production-grade UI styling across all pages.

## Before you start any task

1. Read `progress.md` to see where we left off and what's next.
2. Read `learning.md` to avoid repeating solved problems.
3. If the task is non-trivial, use plan mode (Shift+Tab twice) and show me the plan before writing code.

## After you finish a task

1. Update `progress.md` — mark what's done, note what's next, log any decisions made.
2. Append to `learning.md` if you hit a gotcha, made a non-obvious choice, or found a pattern worth remembering.
3. Run `/compact` before starting an unrelated task. Run `/clear` when fully switching contexts.

## Stack

- **Frontend:** React + Vite, plain CSS for now (Tailwind later if needed)
- **Backend / DB / Auth / Storage:** Firebase (Firestore for real-time data, Storage for photos, no Firebase Auth — see below)
- **Hosting:** Netlify
- **QR codes:** `qrcode` npm package, generated client-side
- **CSV export:** client-side, no library needed

## Auth model (important — not standard)

There are no individual accounts. Read this carefully:

- **Members** log in with a shared chapter passcode + their own first/last name. Name is stored in `localStorage` and attached to every write.
- **Rush chair PIN** is a second, separate passcode required only to create a new rush night QR.
- **Rushees** have no login at all. They hit a public URL and fill a form.

Every Firestore write from a member must include `memberName` and `timestamp`. No exceptions.

## Commands

```
npm install        # install deps
npm run dev        # local dev server (Vite default: localhost:5173)
npm run build      # production build
npm run preview    # preview production build locally
```

Deploy happens via Netlify auto-deploy on push to `main`.

## Architecture (keep it this simple)

```
src/
  pages/        # one file per route (Login, CheckIn, Dashboard, etc.)
  components/   # shared UI (RushieCard, StarRating, etc.)
  lib/          # firebase.js (init + helpers), utils
  hooks/        # useAuth, useRushees, etc.
  App.jsx       # router
```

- **One file per page.** Don't pre-optimize with layouts or shared wrappers until it hurts.
- **Firestore listeners** (`onSnapshot`) for anything that needs to be live. No polling.
- **Client-side image compression** before upload (target <200KB per photo).

## Code style

- Functional React components + hooks. No class components.
- Named exports preferred. Default export only for pages/routes.
- Small files. If a component crosses ~150 lines, split it.
- No premature abstraction. Copy-paste twice before extracting.
- Comments explain *why*, not *what*.

## MVP guardrails (read before adding anything)

The full spec is ambitious. For MVP, ship only this:

1. Member login (passcode + name, persisted in localStorage)
2. Rushee check-in form (with photo upload + duplicate detection)
3. Dashboard roster (live-updating cards, sortable by avg rating)
4. Rushee profile with rate/comment/talked-to
5. QR code page (view + generate with PIN)
6. Bid list kanban (3 columns, drag-drop, live)

**Defer until MVP is working end-to-end:**
- Bid tracker / pledge roster
- CSV export
- PWA / home screen install
- Dark navy + gold styling, glassy cards, all of the polish
- Advanced filters (MVP gets: sort by avg rating, search by name)

If a task pulls in one of the deferred items, stop and ask before building it.

## Gotchas

- Firestore security rules must allow public writes to the `rushees` collection (check-in is unauthenticated). Lock down member-only collections by checking passcode server-side via a Cloud Function, OR rely on the passcode being secret + rules that require a specific field. Document the chosen approach in `learning.md` when decided.
- Photo uploads: compress on client first. Safari on iOS has quirks with `input[type=file][capture=user]` — test on a real iPhone before declaring it done.
- `onSnapshot` listeners leak if not unsubscribed. Always return the unsubscribe function from `useEffect`.

## Project-specific docs (read on demand)

- `progress.md` — current state, next steps, session log
- `learning.md` — gotchas, decisions, lessons
- `spec.md` — full product spec (reference only, don't re-read every session)

## Frontend design skill

When updating, changing, or creating any UI — pages, components, layouts, styling — always use the `/frontend-design` skill (`.claude/commands/frontend-design.md`). This ensures consistent, high-quality, non-generic design across the app. No UI work without it.

## Working style with me

- Keep responses terse. Don't restate the prompt. Don't summarize what you just did unless I ask.
- Before any multi-file change, tell me the plan in bullet points.
- If you're about to install a new dependency, pause and tell me which one and why.
- If you're stuck or uncertain, ask — don't guess.
