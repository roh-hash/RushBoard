# Progress

Running log of project state. Read at session start, update at session end.

## Current status

**Phase:** Live in production, no real chapters onboarded yet. MVP shipped (see "Shipped surface" in CLAUDE.md).
**2026-07-08:** All Firestore data wiped (`firebase firestore:delete --all-collections`) — test chapters removed for a clean slate. Storage test photos still need manual deletion (console → Storage → `chapters/` folder). Auth users left intact.
**Last session:** Security hardening shipped (join codes in private subcollection, rules-validated joins, storage limits), bid columns renamed to Waitlist/Reject, landing page redesigned, member management + rushee delete added.
**Next up:** Register the localhost App Check debug token (run `npm run dev`, copy token from browser console, add in Firebase console → App Check → Apps → Manage debug tokens), then triage rush-season feedback.

## Live QA run — 2026-07-08 (production, post-App-Check-enforcement)

Tested in real Chrome against prod. **Found + fixed + deployed:** chapter creation was
broken — createChapterWithOwner writes private/joinCodes in the creation transaction but
the rule required isRushChair (member doc doesn't exist yet); fixed with
isCreatingOwnChapter on create, rules deployed (commit 125621a).

**PASSED:** /start onboarding email (spam note shows) → chapter created via magic link →
dashboard → rush night + QR + check-in URL → public check-in form incl. photo upload
(Storage rules OK, compression OK, "You're checked in!") → live roster card w/ photo,
tag, night count → profile: 4★ rating (avg recalc OK), comment w/ name+timestamp,
talked-to, bid status Bid → Bid List: renamed Bid/Waitlist/Reject columns, ··· move
Bid→Waitlist live. Delete-rushee section present on Profile.

**NOT tested (do next QA pass):** Bid Tracker interactions (called/response toggles),
Settings (join links copy/regenerate, member management, rename, tags), join flow w/
second account, fully-anonymous check-in WRITE (signed-out browser), real-iPhone photo
capture. **Auth emails land in Gmail spam** — SPF/DKIM custom domain remains the fix.

**Cleanup owed:** test chapter `qa-test-fraternity-claude-test` (+ its rushee "Testy
McRushface", night "QA Night 1", chapterSlugs doc) — delete via Firebase console;
app can't delete chapters/slugs by design. Browser left signed in as rorotx8@gmail.com.

## Backlog

Prioritize from real usage. Deferred-feature guardrail lives in CLAUDE.md — ask before starting one.

- [x] **App Check — enforced 2026-07-08** for Firestore + Storage (secret key registered). Verified post-enforcement: production Firestore Listen returns 200 from an anonymous browser. Remaining: register the localhost debug token (see "Next up").
- [ ] Rules test suite — needs `@firebase/rules-unit-testing` + emulator; **blocked on Java** (emulator requires JRE, not installed)
- [ ] ~~Duplicate rushee merge UI~~ — decided against; delete button on Profile is sufficient
- [ ] Move `recalcAvgRating` to a Cloud Function trigger
- [ ] Deferred (ask before starting): pledge class roster, CSV export, full filters, PWA, restyle, code-splitting

## Session log

Append a short entry each session, newest at the bottom:

```
### YYYY-MM-DD — <short title>
- What got done (1–3 bullets)
- Decisions made
- Next session starts with: <one line>
```

### 2026-04-16 — MVP build (condensed)

Full detail in git history (`d174647` and earlier progress.md versions). Summary:
- Scaffolded Vite + React + Firebase; shipped all MVP features: email-link auth, chapter onboarding/settings/invites, public check-in with photo compression + dedupe, live roster, rushee profile (ratings/comments/talked-to/bid status), QR page, bid kanban, bid tracker.
- Refactored from shared-passcode auth to multi-tenant chapter model with Firebase Auth email links.
- Audit pass fixed crashes (JoinChapter provider, FinishSignIn effect loop), security holes (invite update rule), and consistency issues (serverTimestamp everywhere, transactional recalcAvgRating).

### 2026-07-08 — Post-launch doc reset
- Rewrote CLAUDE.md as a lean production-phase constitution; removed stale spec.md reference and build-phase rituals.
- Condensed progress.md (MVP checklist retired — everything shipped; history preserved in git).
- Renamed `.claude/commands/frontend-design` → `frontend-design.md` so the command actually loads.
- Decision: keep learning.md as-is (append-only, read on demand); deferred-feature list lives only in CLAUDE.md to avoid duplication.
- Committed the pending working-tree changes: join-code invite system (replaces per-email invites), bid tracker stats strip, QR/sign-in UX tweaks. Cleaned up dead invite helpers that failed lint.
- Flagged two rules gaps introduced by the join-code model (world-readable codes; no server-side code check on member create) — top of backlog.
- Next session starts with: harden firestore.rules for join codes.

### 2026-07-08 — Security hardening WS1+2 (rules, storage, check-in)
- Moved join codes off public chapter doc → `chapters/{id}/private/joinCodes` subcollection (rush-chair-only read/write)
- Firestore rules: member create now validates joinCode against private subcollection via rules get(); self-role-escalation blocked on update; dead invites block removed
- Storage rules: constrained writes to images <1MB (was wide open)
- Fixed public check-in (broken since April 17): removed unauthenticated rushee read (findDuplicateRushee); pre-generate doc ref → upload photo first → setDoc with photoURL included in create
- JoinChapter.jsx: role now comes from &role= URL param (non-secret hint; rules validate independently); FinishSignIn.jsx and magic-link flow updated to pass role through
- **Not yet deployed** — see "Deploy steps" section above; deploy rules before pushing code
