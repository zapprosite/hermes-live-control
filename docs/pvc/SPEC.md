# System Specification (SPEC): Hermes Live Control

## Overview
Hermes Live Control is a minimalist AI Agent interface operating on Tauri v2. It presents a simple, conversational UI similar to ChatGPT, concealing advanced agent orchestration capabilities beneath its clean exterior.

## Components
- **Tauri v2 Desktop App:** Core application runner.
- **React Frontend:** UI layer implementing the 16:9 and 9:16 responsive mockups.
- **Tailwind CSS + shadcn/ui:** Styling and component framework for an elegant, calm, dark-themed UI (#000000 background, #171717 surfaces).
- **LiveKit Client:** For real-time voice interactions ("Live Voice" orb).
- **Hermes CLI Interop:** Backend services communicating with the CLI via Tauri IPC/WebSockets.

## Data Models
- `Session`: Represents an ongoing or past conversation context.
- `Memory`: Auto-generated topics and tags from conversations.

## Constraints
- Max 256k tokens context window enforcement.
- UI must start conversations in < 5 seconds.
- One-tap transition to Live Voice.
