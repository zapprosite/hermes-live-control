# PRD.md

# Hermes Live Control

Version: MVP 1.0

Status: Active

---

# Product Vision

Hermes Live Control is an AI Agent Operating System disguised as a simple conversation interface.

At first glance it should feel as simple as ChatGPT.

Only over time should the user discover:

* memory
* skills
* sessions
* voice
* agents
* automation

The interface must reduce cognitive load.

The user should never feel like they are operating enterprise software.

---

# Core Philosophy

Conversation First.

Everything Else Second.

The product is not:

* a dashboard
* an admin panel
* an observability platform
* a workflow builder

The product is:

A place to think, talk and work with an AI agent.

---

# Frozen Architecture Decisions

Core:
Hermes CLI

Realtime Voice:
LiveKit

Frontend:
React
TypeScript
Tailwind
shadcn/ui

Desktop:
Tauri v2

Communication:
WebSocket

Fallback:
SSE

---

# User Experience Principles

Rule 01

Opening Hermes should feel identical to opening ChatGPT.

Rule 02

Voice must be one tap away.

Rule 03

Advanced features remain hidden until needed.

Rule 04

Memory should work automatically.

Rule 05

Sessions should feel natural.

Rule 06

No dashboard anxiety.

---

# Primary User Flows

Flow A

Open App
↓
Ask Question
↓
Receive Answer

Flow B

Open App
↓
Tap Voice
↓
Talk Naturally
↓
Receive Voice Response

Flow C

Open App
↓
Continue Previous Session
↓
Resume Context

---

# MVP Screens

## Screen 01

Home

Purpose:

Start a conversation.

Elements:

Header

* Menu button
* Hermes title

Body

* How can I help you today?

Suggestion Chips

* Continue Session
* Start Live Voice
* Search Memories

Composer

* Attachment
* Text Input
* Microphone
* Live Voice

No dashboards.

No metrics.

No widgets.

---

## Screen 02

Live Voice

Purpose:

Realtime conversation.

Elements:

Minimal voice orb.

States:

* Listening
* Thinking
* Speaking

User can interrupt at any moment.

No waveform overload.

No sci-fi visuals.

---

## Screen 03

Sessions

Purpose:

Resume previous work.

Organization:

Today

Yesterday

This Week

Pinned

Examples:

Hermes Architecture

ZapPro

Refrimix Marketing

OpenRouter Tests

---

## Screen 04

Library

Purpose:

Unified knowledge center.

Contains:

* Memories
* Skills
* Files
* Saved Prompts

The user should not need to understand technical distinctions.

Everything is knowledge.

---

## Screen 05

Settings

Purpose:

Configuration.

Contains:

Hermes CLI

LiveKit

Models

Memory

Appearance

Advanced

---

# Hidden Features

Not visible on Home.

Accessible through menus.

Includes:

* Logs
* Observability
* KV Cache
* Token Usage
* Tool Calls
* Agent Timeline

Target User:

Power users only.

---

# Memory System

Automatic.

Flow:

Conversation
↓
Session Summary
↓
Memory Topic
↓
Tag Assignment
↓
Future Retrieval

User should not manually manage memory.

---

# Skills

Hidden from normal users.

Visible in Library.

Capabilities:

* Install
* Enable
* Disable
* Update

---

# Visual Design

Reference:

ChatGPT Plus

Design Goals:

* Calm
* Spacious
* Elegant
* Minimal

Avoid:

* Enterprise SaaS
* Complex dashboards
* Visual clutter
* Excessive navigation

Color Palette

Background:
#000000

Surface:
#171717

Border:
#2A2A2A

Primary:
#FFFFFF

Secondary:
#A1A1AA

Accent:
#3B82F6

Typography

Inter

Generous spacing.

Large readable hierarchy.

---

# Success Metrics

User can:

Start a conversation in under 5 seconds.

Start voice mode in one tap.

Resume a session in under 2 taps.

Find previous knowledge in under 10 seconds.

---

# Product Statement

Hermes Live Control should feel like ChatGPT.

The difference is that behind the conversation lives an entire operating system for agents.
