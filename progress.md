# Progress

Running log of project state. Read this at the start of every session. Update it at the end.

## Current status

**Phase:** MVP feature-complete.
**Last session:** All 6 MVP features built and working.
**Next up:** Netlify deploy, then end-to-end testing on mobile.

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
- [x] Login page: passcode + name inputs
- [x] Store passcode hash in env var, compare client-side (MVP only — revisit)
- [x] Persist `{ memberName, loggedInAt }` in localStorage
- [x] Redirect to `/dashboard` on success, back to `/` on logout
- [x] Show member name in dashboard header

### Rushee check-in
- [x] Public route `/checkin/:nightId`
- [x] Form: name, hometown, phone, major, year, identity tag, selfie
- [x] Client-side image compression (target <200KB)
- [x] Upload photo to Firebase Storage
- [x] Write rushee doc to Firestore with `nightId` in `attendedNights` array
- [x] Duplicate detection by name OR phone — if match, append night instead of creating
- [x] Confirmation screen with photo + name

### Dashboard roster
- [x] Live-updating grid of rushee cards (`onSnapshot`)
- [x] Card shows: photo, name, hometown, tag badge, avg score, rating count, night count
- [x] Default sort: avg rating high to low
- [x] Search by name
- [x] Tap card → rushee profile page

### Rushee profile
- [x] Full details view
- [x] Star rating (1–5), stored as separate `ratings` subcollection doc per member
- [x] Comment section — each comment shows member name + timestamp
- [x] "Talked to them" toggle per member
- [x] List of all ratings with member names + scores, most recent first

### QR codes page
- [x] View list of existing rush night QRs (any member)
- [x] Generate new QR — prompts for rush chair PIN
- [x] Each QR links to `/checkin/:nightId`
- [x] Display two shareable links (dashboard + check-in) with copy buttons
- [x] Download QR as PNG

### Bid list
- [x] Kanban board: Bid / Watch List / Pass columns
- [x] Drag-drop rushees between columns (live-updating)
- [x] Log `{ memberName, timestamp, movedTo }` on every move

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
