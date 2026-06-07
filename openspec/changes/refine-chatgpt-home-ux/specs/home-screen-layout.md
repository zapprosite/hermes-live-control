# Spec: home-screen-layout

## Behavior: No-message (Home) State

- MUST display centered greeting `"How can I help you today?"` using `text-4xl font-light`
- MUST display subtitle `"Hermes Agent OS"` at `text-xs opacity-50`
- MUST render exactly 4 suggestion chips
- Chips MUST use border-only style (`bg-transparent border border-border/40`)
- Chips MUST show muted label (`text-secondary`) that becomes `text-primary` on hover
- Chips MUST animate `active:scale-95` on press
- NO gradient on heading text (remove `bg-clip-text` approach)

## Behavior: Message State

- MUST render scrollable message list
- User bubbles: right-aligned, `bg-accent text-white rounded-2xl rounded-tr-none`
- Assistant bubbles: left-aligned, `bg-surface border border-border rounded-2xl rounded-tl-none`
- Loading state MUST show a pulsing `"Thinking..."` bubble
- Scroll MUST auto-follow to latest message

## Acceptance Criteria

- [ ] Home state looks calm, spacious, minimal — matches ChatGPT dark mode aesthetic
- [ ] No gradients on text
- [ ] 4 chips visible, low contrast by default
- [ ] Smooth transition when first message is sent (Home → Message view)
