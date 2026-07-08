# RushBoard

Multi-tenant web app for managing fraternity rush. Each chapter gets its own dashboard, roster, bid board, and QR check-in — all live across every phone in the room.

**Live in production, awaiting first real chapters.** Netlify auto-deploys every push to `main`, so pushing is shipping: `npm run build` and `npm run lint` must pass before any task is done, and auth/check-in changes need real-device testing before merge.

## Commands

```
npm run dev        # Vite dev server (localhost:5173)
npm run build      # production build — must pass before a task is "done"
npm run lint       # eslint — must pass
npm run preview    # preview production build locally
```

## Stack

- React 19 + Vite, JavaScript (no TypeScript), plain CSS — one `.css` file per page/component. No Tailwind.
- Firebase: Firestore (data), Storage (photos), Auth (email-link sign-in, no passwords). Client-only app — no backend server or Cloud Functions yet.
- `qrcode` for client-side QR generation; `browser-image-compression` to keep photos <200KB before upload.

## Architecture (keep it this simple)

```
src/
  pages/           # one file per route; default exports
  components/      # shared UI (RusheeCard, ErrorBoundary)
  hooks/           # useAuth, useChapter, useRushees
  lib/firebase.js  # Firebase init + ALL Firestore helpers — data access lives here only
  App.jsx          # router: ProtectedChapterRoute (auth + membership) / PublicChapterRoute (chapter lookup only)
```

- Live data uses `onSnapshot`, never polling. Always return the unsubscribe function from `useEffect`.
- One file per page. No shared layouts or wrappers until it hurts. Copy-paste twice before extracting.
- Functional components + hooks only. Named exports, except default exports for pages. Split files past ~150 lines. Comments explain *why*, not *what*.

Shipped surface: email-link auth, chapter onboarding + settings, public check-in (photo + dedupe), live roster, rushee profile (rate/comment/talked-to/bid status), QR page, bid kanban (Bid/Table/Fade columns), bid tracker.

## Multi-tenant model

- **Chapter = tenant.** Slug-based URLs (`/:chapterSlug/...`), chapter-scoped Firestore subcollections. Slugs are immutable — renaming a chapter updates `displayName` only, never the URL (intentional, avoids breaking printed QR links).
- **Roles:** `rush_chair` (QR, bids, settings, invites) and `member` (dashboard, profiles, ratings, comments). Rushees have no login — they use the public check-in URL `/:chapterSlug/checkin/:nightId`.
- **Chapter creation:** `/start` sends a setup email link; chapter + first rush-chair membership are created in one transaction. **Invites:** rush chairs generate `/:chapterSlug/join?invite=<id>` links from Settings.
- **Session bootstrap:** `collectionGroup('members')` query by UID finds memberships. Membership docs deliberately duplicate `chapterId`/`chapterSlug`/`chapterDisplayName` so this works without a join.
- **Every Firestore write from a member includes the member's UID and `serverTimestamp()`. No exceptions.**
- Rushee names are stored lowercased (`firstName`/`lastName`) for duplicate detection, with a separate `displayName` for display. Always normalize before querying.

## Security invariants

- In `firestore.rules`, `isSignedIn()` alone is never sufficient for a write — always scope to the specific user (`request.auth.uid` / email match) or tenant. This app is multi-tenant; a member of one chapter must never touch another chapter's data.
- Known compromise: unauthenticated rushee check-in writes (with field validation) and open Storage uploads for rushee photos. Transitional until uploads move behind a trusted backend — don't loosen further.

## Gotchas

- Safari on iOS is quirky with `input[type=file][capture=user]` — test photo capture on a real iPhone before declaring it done.
- `recalcAvgRating` runs client-side in a Firestore transaction after each rating write. Long-term this belongs in a Cloud Function trigger.
- `FinishSignIn`-style lesson: never put user-typed input state in a `useEffect` dependency array that fires async side effects.
- More in `learning.md` — check it when a task touches auth, rules, or check-in.

## Guardrails

- **Deferred features** (stop and ask before building any of these): pledge class roster, CSV export, full filter set, PWA manifest/service worker, dark navy + gold restyle, code-splitting (bundle ~746KB).
- **New dependency?** Pause and say which one and why before installing.
- **Any UI work** — pages, components, layout, styling — invoke the `/frontend-design` skill first. No UI work without it.
- **Firestore/Storage rules changes** get a security re-read against the invariants above before commit.

## Project docs

- `progress.md` — current status, next steps, session log. Read at session start; update at session end (what got done, decisions, what's next).
- `learning.md` — append-only gotcha/decision log. Read when a task touches an area it covers; append when you hit a gotcha or make a non-obvious call.

## Working style with me

- Keep responses terse. Don't restate the prompt. Don't summarize what you just did unless I ask.
- Before any multi-file change, tell me the plan in bullet points.
- If you're stuck or uncertain, ask — don't guess.
