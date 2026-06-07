# Tasks: refine-chatgpt-home-ux

## Context Budget
Target model: Claude Sonnet (200k window)
Estimated consumption per task: ~8-12k tokens
All tasks fit in a single clean window.

## Task List

### T1 — Refine Home Screen Typography & Chips
**File:** `src/App.tsx`
**Context Budget:** ~8k tokens

- [ ] Remove gradient from heading (`bg-clip-text text-transparent bg-gradient-to-b`) → replace with plain `text-white/90 font-light`
- [ ] Reduce subtitle opacity: `text-secondary/80` → `text-secondary/50 text-xs`
- [ ] Chips: change `border-border/60` → `border-border/40`, `text-secondary` stays, remove icon opacity tricks, simplify hover to just `hover:bg-border/20`
- [ ] Chips: reduce icon size from `w-4 h-4` to `w-3.5 h-3.5`

**Acceptance:** Home screen heading is plain white, calm. Chips are borderline invisible until hovered.

---

### T2 — Refine Composer & Replace Full-Screen Voice with Inline Mode
**File:** `src/App.tsx`
**Context Budget:** ~12k tokens

- [ ] Composer container: change `rounded-3xl` → `rounded-2xl`
- [ ] Add conditional render for Send icon: only show `<Send>` when `inputText.length > 0`
- [ ] Remove the `{isLiveVoice && (...)}` full-screen overlay block entirely
- [ ] Add inline voice active state inside Composer: when `isLiveVoice`, render a `animate-pulse bg-accent/20 rounded-full h-2 mx-4` bar with `"Listening..."` label in place of textarea
- [ ] Add `×` dismiss button next to Voice button when `isLiveVoice` is true
- [ ] Remove `<Mic>` icon if it is redundant with the Voice button (keep only one mic-type control) — judgment call during implementation

**Acceptance:** Composer is clean single row. Voice mode is inline. No full-screen overlay. No TS errors.

---

### T3 — Commit & Verify
**Action:** Run build validation and commit

- [ ] Run `npm run build` — must pass with 0 errors
- [ ] Run `git add src/App.tsx src/index.css && git commit -m "refine: ChatGPT-like minimalist Home UX"`
- [ ] Run `git push origin main`

**Acceptance:** Clean build. Clean commit on `main`.
