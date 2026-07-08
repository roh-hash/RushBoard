# Progress

Running log of project state. Read at session start, update at session end.

## Current status

**Phase:** Live in production. MVP shipped (see "Shipped surface" in CLAUDE.md).
**Last session:** Committed join-code invite system, bid tracker stats, and post-launch doc reset.
**Next up:** Harden Firestore rules for the join-code model (see backlog), then triage rush-season feedback.

## Backlog

Prioritize from real usage. Deferred-feature guardrail lives in CLAUDE.md — ask before starting one.

- [ ] **Security — join codes are world-readable:** `chapters/{id}` has `allow read: if true`, and join codes now live on the chapter doc, so anyone can read `rushChairJoinCode` for any chapter. Move codes to a rush-chair-only subcollection or validate joins server-side.
- [ ] **Security — member create rule doesn't check the code:** `members/{uid}` allows any signed-in user to create their own doc with any role; the join-code check is client-side only. Rules should validate the code (or joins should go through a trusted backend).
- [ ] Remove stale `invites/{inviteId}` block from firestore.rules (invite system replaced by join codes) and deploy rules
- [ ] Tighten Storage rules once photo upload moves behind a trusted backend
- [ ] Move `recalcAvgRating` to a Cloud Function trigger
- [ ] Deferred features (in CLAUDE.md guardrails): pledge class roster, CSV export, full filters, PWA, restyle, code-splitting

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
