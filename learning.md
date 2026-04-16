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
