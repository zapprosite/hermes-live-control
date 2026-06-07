# Spec: composer-and-voice-entry

## Behavior: Composer Bar

- MUST be a single row: `[attachment] [textarea] [mic] [send] [voice]`
- Send icon MUST only be visible when `inputText.length > 0` (conditional render)
- Mic icon MUST always be visible (push-to-talk placeholder)
- Voice (Orbit icon) button MUST always be visible
- Container: `rounded-2xl` (NOT `rounded-3xl`)
- `focus-within` ring: `ring-1 ring-accent/40`
- Textarea: auto-grows with content, max 6 rows

## Behavior: Voice Active (Inline Mode)

- When voice is toggled ON, the textarea is replaced with a soft pulsing bar
  (`animate-pulse bg-accent/20 rounded-full h-2 mx-4`)
- A subtle label `"Listening..."` appears below the bar in `text-xs text-secondary`
- An `×` button appears to the left of the voice (Orbit) button to dismiss
- The full-screen overlay is NOT used in this pass
- `isLiveVoice` state continues to drive this, but renders inline only

## Acceptance Criteria

- [ ] Composer is a clean single row with 4-5 icons max
- [ ] Send icon hidden when textarea is empty
- [ ] Voice mode renders inline (no full-screen takeover)
- [ ] Dismiss `×` resets `isLiveVoice` to false
- [ ] No TypeScript errors introduced
