# Design: refine-chatgpt-home-ux

## Design Philosophy

The PRD states: "Conversation First. Everything Else Second."
The reference is ChatGPT Plus in dark mode. The design principle is:
**calm, spacious, elegant, minimal.**

## Component-by-Component Decisions

### 1. Home Screen (No Messages State)

**Current:** Gradient heading, chips, heavy vertical spacing.

**Target:**
- Centered greeting: `"How can I help you today?"` — light weight (`font-light`), no gradient fill
- Subtitle: `"Hermes Agent OS"` — very low opacity, `text-xs`
- Chips: 4 chips maximum. Low contrast. Border only, no fill. Hover reveals fill subtly.
- No hero icons in chips — icon + label only if icon is `w-3.5 h-3.5`, muted opacity

### 2. Voice Orb Entry Point

**Current:** Full-screen takeover overlay activated from Home — too heavy.

**Target:**
- The Live Voice button in the Composer remains but has NO full-screen overlay on Home.
- Clicking Voice simply transitions the Composer into a "Voice Active" mini-state inline
  (the textarea becomes a soft pulsing bar, and an `×` dismisses it).
- The full-screen voice overlay is REMOVED from this pass entirely.
- Rationale: PRD says "Voice must be one tap away" — not "Voice must fill the screen".

### 3. Composer

**Current:** Attachment icon | Textarea | Mic icon | Orbit/Voice button (two right icons).

**Target:**
- Left: Attachment (paperclip) — `text-secondary`, hover only
- Center: Textarea, placeholder `"Talk to Hermes..."`
- Right: Send icon (only visible when `inputText.length > 0`)
- Right: Mic icon (push-to-talk, always visible)
- Right: Voice button (orbit icon, toggles inline voice mode)
- No rounded-3xl — use `rounded-2xl` for a slightly less pill-like feel

### 4. Sessions Sidebar

**Current:** Opens on Menu click with a dark overlay.

**Target:** Keep exact current implementation — no changes to sidebar logic.
Only ensure the Menu icon in the header is `text-secondary` by default.

### 5. Color / Typography Cleanup

- All `text-primary` headings use `font-light` or `font-normal`, never `font-semibold`
- Chip borders: `border-border/40` (more transparent than current `border-border/60`)
- Chip text: `text-secondary` (muted), turns `text-primary` on hover
- Background stays `#000000`. Surface `#171717`. No changes to CSS variables.

## Files to Edit

- `src/App.tsx` — component layout, state, interactions
- `src/index.css` — only if a utility class needs to be added (e.g. a `voice-pulse` keyframe)

## Files NOT to Edit

- `src-tauri/**` — frozen
- `openspec/**` — frozen
- `docs/**` — frozen
- Any `.md` at root — frozen
