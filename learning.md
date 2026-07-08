# Learning

Append-only log. When you (or I) hit a gotcha, make a non-obvious decision, or discover a pattern worth keeping — write it here. Don't delete entries, just add new ones.

This file exists so we stop re-solving the same problems. If something is unclear in CLAUDE.md and gets clarified in a session, capture it here first — promote to CLAUDE.md only if it becomes a standing rule.

## Format

```
## YYYY-MM-DD — <short title>
**Context:** what was happening
**Problem / question:** what went wrong or what we had to choose
**Resolution:** what we did and why
**Takeaway:** the one-liner we want to remember
```

---

## 2026-04-16 — Why CLAUDE.md / progress.md / learning.md are separated
**Context:** Setting up the project docs for Claude Code.
**Problem:** Tempting to dump everything into one big CLAUDE.md.
**Resolution:** Split into three files with distinct jobs:
- `CLAUDE.md` = standing rules + project constitution. Loaded every turn, so every line is taxed repeatedly. Keep under 200 lines.
- `progress.md` = where we are and what's next. Read at session start, updated at session end.
- `learning.md` = episodic lessons. Read only when relevant.
**Takeaway:** Progressive disclosure. CLAUDE.md points to the other files; Claude reads them only when needed. This keeps per-turn context cheap.

## 2026-04-16 — MVP scope discipline
**Context:** The full spec is huge (bid tracker, PWA, polished dark-navy UI, full filter set, etc.).
**Problem:** Building all of it before anything works end-to-end will burn hours and tokens on polish before validating the core loop.
**Resolution:** MVP = login, check-in, roster, profile+rating, QR, bid kanban. Everything else deferred. CLAUDE.md contains a guardrail that says "stop and ask before building deferred items."
**Takeaway:** End-to-end working > partially-polished. Ship ugly, then iterate.

---

<!-- New entries go below this line. Newest at the bottom so the session log reads chronologically. -->

## 2026-04-16 — Duplicate detection uses lowercased names
**Context:** Building rushee check-in with duplicate detection.
**Problem:** Name matching is fragile — "John Smith" vs "john smith" would create duplicates.
**Resolution:** Store `firstName` and `lastName` as lowercase in Firestore, keep a separate `displayName` field with original casing for display.
**Takeaway:** Always normalize before querying. Display name is separate from query name.

## 2026-04-16 — Chapter membership docs need chapter metadata duplicated
**Context:** Refactoring RushBoard from a single global roster into chapter-scoped data with Firebase Auth.
**Problem / question:** After email-link sign-in, the app needs to know which chapter dashboards a user can enter before a specific chapter page has loaded.
**Resolution:** Store `chapterId`, `chapterSlug`, and `chapterDisplayName` directly on each `chapters/{chapterId}/members/{uid}` doc. This makes `collectionGroup('members')` lookups viable for the signed-in session bootstrap without an extra join layer.
**Takeaway:** Duplicate a small amount of chapter metadata onto membership docs when it makes auth/session bootstrapping dramatically simpler.

## 2026-04-16 — Public check-in rules stay looser until uploads move behind trusted code
**Context:** The new chapter model adds Firebase rules files, but rushee check-in still happens directly from the browser and can upload photos before any member is signed in.
**Problem / question:** Strict chapter-private rules conflict with a public check-in flow unless a trusted backend mediates the write/upload.
**Resolution:** Keep the current browser-only public check-in path working, but document in `storage.rules` and the session log that this should be tightened once photo upload and invite issuance move behind Cloud Functions or another trusted backend.
**Takeaway:** Public browser writes are the sharp edge in a multi-tenant Firebase app; treat them as a transitional compromise, not the finished security model.

## 2026-04-16 — FinishSignIn useEffect must not depend on user-typed state
**Context:** FinishSignIn had `email` in its useEffect dependency array so it could handle the "needs_email" case.
**Problem:** Every keystroke in the email input re-ran the entire effect, spamming `signInWithEmailLink` calls to Firebase Auth.
**Resolution:** Removed `email` from deps. The effect only runs once on mount. If the user needs to type their email (no pendingEmail in localStorage), a separate submit handler calls the sign-in function explicitly.
**Takeaway:** Never put user-controlled input state in a useEffect dependency array that triggers async side effects.

## 2026-04-16 — Firestore invite rules must scope update access
**Context:** The invite update rule was `isRushChair(chapterId) || isSignedIn()`.
**Problem:** Any signed-in user from any chapter could accept (update) any invite in any other chapter.
**Resolution:** Changed to `isRushChair(chapterId) || (isSignedIn() && resource.data.email == request.auth.token.email)` — only the invite's intended recipient or the chapter's rush chair can update it.
**Takeaway:** In multi-tenant Firestore rules, `isSignedIn()` alone is never enough for cross-tenant writes. Always scope to the specific user or tenant.

## 2026-07-08 — Join codes live on a publicly readable chapter doc
**Context:** Replaced per-email invites with shareable join-code links (`/:slug/join?code=...`); codes stored as `memberJoinCode`/`rushChairJoinCode` on the chapter doc.
**Problem / question:** `chapters/{id}` has `allow read: if true` (needed for public check-in chapter lookup), so the join codes — including the rush-chair one — are readable by anyone who queries the chapter doc. The member-create rule also never validates the code; the check is client-side only.
**Resolution:** Shipped as-is to unblock the UX win, but logged both gaps at the top of the progress.md backlog. Fix is to move codes to a rush-chair-only subcollection and/or validate joins behind a trusted backend or rules-level check.
**Takeaway:** Anything stored on a `read: if true` doc is public API. Secrets (codes, tokens) must live in a scoped subcollection or server-side.

## 2026-07-08 — Public check-in was broken: unauthenticated reads on rushees fail
**Context:** `submitRusheeCheckIn` called `findDuplicateRushee` first, which does a `getDocs` on the rushees collection. Firestore rules say `allow read: if isChapterMember(chapterId)`. Unauthenticated public check-in visitors fail that check immediately.
**Problem / question:** Check-in was broken from the first rules deploy (April 17). A separate `updateDoc` to attach `photoURL` also failed — `isPublicRusheeUpdate` only allows `attendedNights`/`updatedAt`.
**Resolution:** Removed `findDuplicateRushee` from the public check-in path (unauthenticated reads can't work without exposing PII to the public or using a Cloud Function). Pre-generate the doc ref, upload the photo first, then `setDoc` with `photoURL` already included — no separate update needed. Duplicate merging is now a manual task in the roster.
**Takeaway:** Unauthenticated Firestore reads require a `allow read: if true` rule on that collection, which exposes all docs. Never add it to rushees (PII). Duplicate detection for public flows needs a trusted backend or must be skipped.

## 2026-07-08 — Join code security: rules-level validation via subcollection get()
**Context:** Moving join codes off the public chapter doc into `chapters/{id}/private/joinCodes`.
**Problem / question:** Joiners can't read the private doc to compare the code — so how does the UI know which role a link grants? How does the server validate without a Cloud Function?
**Resolution:** Firestore rules can call `get()` on any path regardless of the client's read permission. Member create rule validates `request.resource.data.joinCode == get(joinCodesPath).data.rushChairCode` (or memberCode). The role hint is encoded in the join URL as `&role=rush_chair` — it's non-secret metadata; the rules validate the code independently so a manipulated role param just gets a rules denial.
**Takeaway:** Rules `get()` is a powerful escape hatch for server-side validation without Cloud Functions. It doesn't bypass the client's inability to read the doc — it's a server-to-server read inside the rules engine.

## 2026-07-08 — Deployment order matters when rules and code are tightly coupled
**Context:** New rules require `joinCode` field on member-create writes; new client code sends it. Old client code doesn't. Old join links lack `&role=`.
**Resolution:** Deploy rules first, then push code. This sequence: (1) revokes old join links at the rules level immediately, (2) gives rush chairs access to `private/joinCodes` so the new Settings UI can work as soon as code deploys. Deploying code first would leave a window where Settings.jsx fails (denied reads on private/joinCodes under old rules).
**Takeaway:** When rules tighten a write path that client code also changes, deploy rules first. New rules + old client = denial (safe). Old rules + new client = gap (unsafe).
