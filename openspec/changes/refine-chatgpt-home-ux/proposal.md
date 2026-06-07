# Change Proposal: refine-chatgpt-home-ux

## Summary

Refine the Home screen UI of Hermes Live Control to precisely match the validated
minimalist, ChatGPT-like standard. The current implementation has visual excess
(voice orb overlay weight, redundant controls, overly prominent advanced features)
that diverges from the PRD's "Conversation First" philosophy.

## Problem

The existing `App.tsx` has:
- A full-screen Live Voice overlay that is too visually heavy for the Home state
- Controls and affordances exposed that should be hidden until needed
- The Composer area has redundant icon slots
- Suggestion chips lack the subtle, calm aesthetic of ChatGPT's UI
- Advanced features (sessions sidebar) are too easily triggered

## Proposed Solution

Refine `src/App.tsx` and `src/index.css` only. No backend, no Rust, no LiveKit,
no PVC changes. Purely a frontend polish pass focused on:

1. Reducing voice orb visual weight on the Home screen
2. Hiding advanced controls behind gesture/intent
3. Cleaning up the Composer to a single row of essential actions
4. Making suggestion chips subtler and calmer
5. Ensuring the overall surface feels as calm as ChatGPT Plus dark mode

## Scope Restrictions (Hard Limits)

- ❌ Do NOT touch `src-tauri/` or any Rust code
- ❌ Do NOT touch LiveKit integration logic
- ❌ Do NOT touch PVC, OpenSpec, or `openspec/` directory
- ❌ Do NOT create new folders or files outside of `src/`
- ✅ Only edit `src/App.tsx` and `src/index.css`

## Success Criteria

- Home screen is visually calm, minimal — identical aesthetic to ChatGPT dark mode
- Voice orb entry point is present but unobtrusive (inline icon, not full overlay)
- Advanced features are hidden by default
- Composer is clean: attachment, text, mic, send
- Suggestion chips are subtle, low-contrast, elegant
