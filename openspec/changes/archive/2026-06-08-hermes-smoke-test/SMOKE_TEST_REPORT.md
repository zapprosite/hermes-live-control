# Hermes Smoke Test Report

**Date:** 2026-06-06
**Build:** `npm run tauri dev` (dev profile)
**Hermes CLI:** Hermes Agent v0.16.0 (2026.6.5) · upstream ebed881d

---

## Results

| Scenario | Result | Notes |
|---|---|---|
| T1 New conversation | ⏳ PENDING | |
| T2 Continue conversation | ⏳ PENDING | |
| T3 App restart + resume | ⏳ PENDING | |
| T4 Multiple sessions isolation | ⏳ PENDING | |
| T5 Error handling | ⏳ PENDING | |

## Overall: ⏳ IN PROGRESS

---

## Environment

| Check | Status |
|---|---|
| `/home/will/.local/bin/hermes` exists | ✅ PASS |
| `hermes --version` responds | ✅ PASS (v0.16.0) |
| `npm run tauri dev` opens without errors | ✅ PASS |
| `@tauri-apps/api/event` optimized by Vite | ✅ PASS |

---

## Issues Found

*(fill in after each test)*

---

## Test Execution Log

### T1 — New Conversation

**Steps:**
1. App open at `npm run tauri dev`
2. Send: `Meu nome é Will`

**Observe:**
- [ ] Streaming bubble appears before response completes
- [ ] Final message bubble replaces streaming state
- [ ] Session JSON has `cli_session_id` populated

**Result:** *(fill in)*

---

### T2 — Continue Conversation

**Steps:**
1. Same session as T1
2. Send: `Qual meu nome?`

**Observe:**
- [ ] Hermes responds with "Will"
- [ ] `cli_session_id` unchanged in session JSON

**Result:** *(fill in)*

---

### T3 — App Restart + Resume

**Steps:**
1. Close app (kill terminal running tauri dev)
2. Reopen with `npm run tauri dev`
3. Select the T1/T2 session from sidebar
4. Send: `Qual meu nome?`

**Observe:**
- [ ] Message history visible after restart
- [ ] Hermes still answers "Will"

**Result:** *(fill in)*

---

### T4 — Multiple Sessions / Isolation

**Steps:**
1. Session A → `Meu nome é Alice`
2. Session B → `Meu nome é Bob`
3. Session A → `Qual meu nome?` → expect "Alice"
4. Session B → `Qual meu nome?` → expect "Bob"

**Observe:**
- [ ] Session A answers "Alice"
- [ ] Session B answers "Bob"
- [ ] `cli_session_id` distinct in each session JSON

**Result:** *(fill in)*

---

### T5 — Error Handling

**Steps:**
```bash
mv /home/will/.local/bin/hermes /home/will/.local/bin/hermes.bak
```
1. Send any message in running app
2. Observe error bubble
3. Restore:
```bash
mv /home/will/.local/bin/hermes.bak /home/will/.local/bin/hermes
```
4. Send message again — confirm recovery

**Observe:**
- [ ] Error bubble with red border appears
- [ ] Error text contains "Hermes CLI not found"
- [ ] Input re-enabled (not locked in isLoading)
- [ ] Works normally after restore

**Result:** *(fill in)*

---

## Verification of Session JSON

After T1, check:
```bash
ls ~/.local/share/com.will.hermes-live-control/sessions/
cat ~/.local/share/com.will.hermes-live-control/sessions/<id>.json | grep cli_session_id
```
