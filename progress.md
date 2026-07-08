# Progress

Running log of project state. Read at session start, update at session end.

## Current status

**Phase:** Live in production. MVP shipped (see "Shipped surface" in CLAUDE.md).
**Last session:** Committed join-code invite system, bid tracker stats, and post-launch doc reset.
**Next up:** Harden Firestore rules for the join-code model (see backlog), then triage rush-season feedback.

## Backlog

Prioritize from real usage. Deferred-feature guardrail lives in CLAUDE.md — ask before starting one.

- [ ] **App Check:** `VITE_RECAPTCHA_SITE_KEY` is not set — App Check is inactive. Add key to `.env` + Netlify env vars, then enable enforcement in Firebase console for Firestore and Storage.
- [ ] Member management UI in Settings (remove member, change role) — in progress
- [ ] Rules test suite — needs `@firebase/rules-unit-testing` + emulator; **blocked on Java** (emulator requires JRE, not installed)
- [ ] Duplicate rushee full merge UI (consolidate two docs + subcollections) — delete button on Profile unblocks the immediate gap
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
