# RushBoard

Multi-tenant web app for managing fraternity rush. Each chapter gets its own dashboard, roster, bid board, and QR check-in — all live across every phone in the room.

## Project state

**Phase:** MVP feature-complete including bid tracker. Now entering frontend design/polish phase.
**Scope right now:** production-grade UI styling across all pages, Firebase console configuration, end-to-end testing of email-link auth and invite flows.

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
- **Backend / DB / Auth / Storage:** Firebase (Firestore, Storage, Firebase Auth with email-link sign-in)
- **Hosting:** Netlify
- **QR codes:** `qrcode` npm package, generated client-side
- **Image compression:** `browser-image-compression` npm package, client-side
- **CSV export:** client-side, no library needed (deferred)

## Auth model (multi-tenant, email-link)

- **Firebase Auth email-link sign-in** — no passwords. Users receive a magic link via email.
- **Chapters** are the top-level tenant. Each chapter has its own Firestore subcollections, slug-based URL, and member list.
- **Rush chairs** create a chapter via `/start`, which sends a setup email link. On completion, the chapter and first rush-chair membership are created in a transaction.
- **Members** are invited by rush chairs from the Settings page. Invites generate a join URL (`/:chapterSlug/join?invite=<id>`) that triggers an email-link sign-in and membership creation.
- **Roles:** `rush_chair` (full access: QR, bids, settings, invites) and `member` (dashboard, profiles, ratings, comments).
- **Rushees** have no login. They hit a public check-in URL (`/:chapterSlug/checkin/:nightId`) and fill a form.
- **Session bootstrap:** On sign-in, a `collectionGroup('members')` query finds all active memberships for the user's UID. The app redirects to the first chapter's dashboard.

Every Firestore write from a member must include the member's UID and `serverTimestamp()`. No exceptions.

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
  pages/        # one file per route (Home, SignIn, CreateChapter, Dashboard, CheckIn, etc.)
  components/   # shared UI (RusheeCard, etc.)
  lib/          # firebase.js (init + all Firestore helpers)
  hooks/        # useAuth, useChapter, useRushees
  App.jsx       # router with ProtectedChapterRoute / PublicChapterRoute wrappers
```

- **One file per page.** Don't pre-optimize with layouts or shared wrappers until it hurts.
- **Firestore listeners** (`onSnapshot`) for anything that needs to be live. No polling.
- **Client-side image compression** before upload (target <200KB per photo).
- **Chapter-scoped routes:** Protected routes use `ProtectedChapterRoute` (auth + membership check). Public routes (check-in, join) use `PublicChapterRoute` (chapter lookup only).

## Code style

- Functional React components + hooks. No class components.
- Named exports preferred. Default export only for pages/routes.
- Small files. If a component crosses ~150 lines, split it.
- No premature abstraction. Copy-paste twice before extracting.
- Comments explain *why*, not *what*.

## What's shipped

1. Email-link auth (sign-in, chapter creation, invite acceptance)
2. Chapter onboarding + settings (identity, rushee tags, member invites)
3. Rushee check-in form (photo upload, compression, duplicate detection)
4. Dashboard roster (live-updating cards, sortable by avg rating, search by name)
5. Rushee profile with rate/comment/talked-to + bid status (rush chair only)
6. QR code page (generate, view, copy links, download PNG)
7. Bid list kanban (bid/table/fade columns, drag-drop, live)
8. Bid tracker (call status, response tracking for bid-column rushees)

## Deferred (post-MVP)

- Pledge class roster
- CSV export
- Full filter set (by night, by tag, unrated-by-me, not-talked-to)
- PWA manifest + service worker
- Dark navy + gold styling, glassy cards, bottom nav bar
- Code-splitting / lazy routes (bundle is currently ~746KB)

If a task pulls in one of the deferred items, stop and ask before building it.

## Gotchas

- **Public check-in writes:** Firestore rules allow unauthenticated creates/updates to the `rushees` collection with field validation. Storage rules are currently open for rushee photo uploads — tighten once uploads move behind a trusted backend.
- **Photo uploads:** compress on client first. Safari on iOS has quirks with `input[type=file][capture=user]` — test on a real iPhone before declaring it done.
- **`onSnapshot` listeners leak** if not unsubscribed. Always return the unsubscribe function from `useEffect`.
- **`recalcAvgRating`** runs client-side in a transaction after each rating write. Long-term this should be a Cloud Function trigger.
- **Slug immutability:** Renaming a chapter in Settings updates `displayName` but not the URL slug. This is intentional for now to avoid breaking links.

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
