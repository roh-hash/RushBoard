# Progress

Running log of project state. Read this at the start of every session. Update it at the end.

## Current status

**Phase:** Bug-fix pass complete. Ready for Firebase console config + end-to-end testing.
**Last session:** Audited entire codebase, fixed critical bugs, security issues, and stale docs.
**Next up:** Configure Firebase console/auth domains/rules for the new flow, then run full end-to-end testing with real email links and invite flows.

## MVP checklist

Work these in order. Check items off as completed. Don't skip ahead.

### Setup
- [x] Initialize Vite + React project in this directory
- [x] Install core deps: `firebase`, `react-router-dom`, `qrcode`
- [x] Create Firebase project, enable Firestore + Storage
- [x] Add Firebase config to `src/lib/firebase.js` (use env vars)
- [x] Set up basic routing in `App.jsx`
- [ ] Netlify deploy working from `main` branch

### Auth + Login
- [x] Replace passcode login with Firebase email-link sign-in
- [x] Persist auth with Firebase Auth instead of localStorage-only passcodes
- [x] Redirect signed-in users to their chapter dashboard
- [x] Show active member name in dashboard header

### Rushee check-in
- [x] Public route `/:chapterSlug/checkin/:nightId`
- [x] Form: name, hometown, phone, major, year, identity tag, selfie
- [x] Client-side image compression (target <200KB)
- [x] Upload photo to Firebase Storage
- [x] Write rushee doc under chapter-scoped Firestore path with `nightId` in `attendedNights` array
- [x] Duplicate detection by name OR phone inside the same chapter
- [x] Confirmation screen with photo + name

### Dashboard roster
- [x] Live-updating grid of rushee cards (`onSnapshot`)
- [x] Card shows: photo, name, hometown, tag badge, avg score, rating count, night count
- [x] Default sort: avg rating high to low
- [x] Search by name
- [x] Tap card → chapter-scoped rushee profile page
- [x] Dashboard header uses fraternity + chapter name + "Rush"

### Rushee profile
- [x] Full details view
- [x] Star rating (1–5), stored as separate `ratings` subcollection doc keyed by member uid
- [x] Comment section — each comment shows member name + timestamp
- [x] "Talked to them" toggle keyed by member uid
- [x] List of all ratings with member names + scores, most recent first

### QR codes page
- [x] View list of existing rush night QRs (rush-chair-only route)
- [x] Generate new QR for the active chapter
- [x] Each QR links to `/:chapterSlug/checkin/:nightId`
- [x] Display two shareable links (dashboard + check-in) with copy buttons
- [x] Download QR as PNG

### Bid list
- [x] Kanban board: Bid / Watch List / Pass columns
- [x] Drag-drop rushees between columns (live-updating)
- [x] Log `{ memberName, timestamp, movedTo }` on every move

### Chapters + Settings
- [x] `Start using RushBoard` launches chapter onboarding
- [x] Create chapter with fraternity name + charter name + initial rush chair
- [x] Add chapter-scoped routes and chapter lookup by slug
- [x] Add chapter settings page for rushee tags and invite links
- [x] Add member/rush-chair invite flow by email link
- [x] Add Firebase rules/config scaffolding files for chapter model

## Deferred (post-MVP)

- ~~Bid tracker (accepted/declined/etc. logging)~~ — shipped, see /bid-tracker route
- Pledge class roster
- CSV export
- Full filter set (by night, by tag, unrated-by-me, not-talked-to)
- PWA manifest + service worker
- Dark navy + gold styling, glassy cards, bottom nav bar
- "Unrated by me" and "Not talked to" filters

## Session log

Append a short entry each session. Format:

```
### YYYY-MM-DD — <short title>
- What got done (1–3 bullets)
- Decisions made
- What's blocked or unclear
- Next session starts with: <one line>
```

### 2026-04-16 — Project scaffolding
- Created CLAUDE.md, progress.md, learning.md.
- Stack locked in: Vite + React, Firebase, Netlify.
- Next session starts with: run `npm create vite@latest` in project root and pick React (JavaScript, not TypeScript for MVP speed).

### 2026-04-16 — Differentiated Rush Chair and Member logins
- Added radio buttons in Login.jsx for Rush Chair (passcode "rush2026") and Member (env VITE_MEMBER_PASSCODE)
- Updated useAuth to store isRushChair flag
- Hid "New Rush Night" and "Bid List" buttons in Dashboard for members
- Hid bid status section in Profile for members
- Replaced PinGate with RushChairRoute in App.jsx for /qr, /bids, /bid-tracker
- Build passes without errors.
- Next session starts with: Netlify deploy setup.

### 2026-04-16 — Created home page with separate login routes
- Created Home.jsx landing page with buttons for Member Login, Rush Chair Login, and Start using RushBoard (disabled).
- Created MemberLogin.jsx and RushChairLogin.jsx as dedicated login pages.
- Updated App.jsx routes: "/" -> Home, "/member-login" -> MemberLogin, "/rush-chair-login" -> RushChairLogin.
- Each login page has a back button to home page.
- Build passes without errors.
- Next session starts with: Test home page and login flow.

### 2026-04-16 — Refactored RushBoard into a chapter-scoped app
- Replaced shared passcode auth with Firebase email-link auth and membership lookup via Firestore.
- Moved the app to chapter-scoped routes and Firestore collections, added onboarding, invites, settings, and chapter-branded dashboard/check-in flows.
- Added Firebase rules/config scaffolding (`firebase.json`, `firestore.rules`, `storage.rules`) to match the new multi-tenant structure.
- Build and lint pass locally; real email-link onboarding still needs Firebase console configuration and end-to-end validation.
- Next session starts with: wire the Firebase console settings/auth domains, then test onboarding, invite acceptance, and public check-in against a live project.

### 2026-04-16 — Codebase audit and bug fixes
- Fixed crash: JoinChapter route was missing ChapterProvider wrapper (PublicChapterRoute).
- Fixed crash: FinishSignIn useEffect re-fired on every keystroke due to `email` in deps; rewrote to use explicit submit.
- Security: tightened invite update rule to require matching email, not just any signed-in user.
- Security: clipboard.writeText calls now have .catch() for non-HTTPS/permission-denied contexts.
- Fixed: setBidStatus, clearBidStatus, setCallStatus now use serverTimestamp() instead of client Date.
- Fixed: recalcAvgRating now runs inside a Firestore transaction to prevent race conditions.
- Fixed: createRushNight in QRCodes now has try/catch error handling.
- Cleaned up: removed dead VITE_CHAPTER_PASSCODE / VITE_MEMBER_PASSCODE from .env and .env.example.
- Rewrote CLAUDE.md to reflect the current multi-tenant email-link auth model.
- Next session starts with: Firebase console config, then end-to-end testing.
