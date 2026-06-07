## 1. Environment Setup

- [ ] 1.1 Confirm `hermes` binary is present at `/home/will/.local/bin/hermes` and responds to `hermes --version`
- [ ] 1.2 Run `npm run tauri dev` and confirm the app window opens without console errors

## 2. T1 — New Conversation

- [ ] 2.1 In a fresh session (title "New Chat"), send: `Meu nome é Will`
- [ ] 2.2 Verify the streaming bubble appears immediately (not a full-page spinner)
- [ ] 2.3 Verify the response completes and a final message bubble replaces the streaming state
- [ ] 2.4 Open the session JSON file in `app_data_dir/sessions/` and confirm `cli_session_id` is now populated
- [ ] 2.5 Record result in `SMOKE_TEST_REPORT.md` as **T1: PASS** or **T1: FAIL \<reason\>**

## 3. T2 — Continue Conversation (same session)

- [ ] 3.1 In the same session from T1, send: `Qual meu nome?`
- [ ] 3.2 Verify Hermes responds with "Will" (or a phrase containing the name)
- [ ] 3.3 Confirm no second `cli_session_id` was created (value unchanged in session JSON)
- [ ] 3.4 Record result in `SMOKE_TEST_REPORT.md` as **T2: PASS** or **T2: FAIL \<reason\>**

## 4. T3 — App Restart + Resume

- [ ] 4.1 Close the app window completely (`Cmd+Q` / kill process)
- [ ] 4.2 Reopen with `npm run tauri dev`
- [ ] 4.3 Select the session from T1/T2 in the sidebar
- [ ] 4.4 Verify the message history is visible (both messages from T1 and T2)
- [ ] 4.5 Send: `Qual meu nome?`
- [ ] 4.6 Verify Hermes still answers "Will" (context resumed via `-r <cli_session_id>`)
- [ ] 4.7 Record result in `SMOKE_TEST_REPORT.md` as **T3: PASS** or **T3: FAIL \<reason\>**

## 5. T4 — Multiple Sessions / Isolation

- [ ] 5.1 Create **Session A** — send: `Meu nome é Alice`; confirm response
- [ ] 5.2 Create **Session B** — send: `Meu nome é Bob`; confirm response
- [ ] 5.3 Switch back to **Session A** — send: `Qual meu nome?`
- [ ] 5.4 Verify Hermes answers "Alice", not "Bob" (no cross-contamination)
- [ ] 5.5 Switch to **Session B** — send: `Qual meu nome?`
- [ ] 5.6 Verify Hermes answers "Bob"
- [ ] 5.7 Confirm the `cli_session_id` values in each session JSON are distinct
- [ ] 5.8 Record result in `SMOKE_TEST_REPORT.md` as **T4: PASS** or **T4: FAIL \<reason\>**

## 6. T5 — Error Handling (Missing Binary)

- [ ] 6.1 Temporarily rename the binary: `mv /home/will/.local/bin/hermes /home/will/.local/bin/hermes.bak`
- [ ] 6.2 In the running app, send any message
- [ ] 6.3 Verify an **error bubble** appears in the UI (red border style)
- [ ] 6.4 Verify the error text contains "Hermes CLI not found" (not a fake response)
- [ ] 6.5 Verify the input is re-enabled after the error (not locked in `isLoading`)
- [ ] 6.6 Restore the binary: `mv /home/will/.local/bin/hermes.bak /home/will/.local/bin/hermes`
- [ ] 6.7 Send a message again and confirm it works normally
- [ ] 6.8 Record result in `SMOKE_TEST_REPORT.md` as **T5: PASS** or **T5: FAIL \<reason\>**

## 7. Report

- [ ] 7.1 Create `SMOKE_TEST_REPORT.md` in this change root with the full results table (template below)
- [ ] 7.2 If all five scenarios PASS → proceed to `/opsx:archive hermes-bridge-foundation`
- [ ] 7.3 If any scenario FAILS → open a targeted fix change before archiving

---

### SMOKE_TEST_REPORT.md template

```markdown
# Hermes Smoke Test Report

**Date:** YYYY-MM-DD  
**Build:** `npm run tauri dev` (dev profile)  
**Hermes CLI:** `hermes --version` output here  

## Results

| Scenario | Result | Notes |
|---|---|---|
| T1 New conversation | PASS / FAIL | |
| T2 Continue conversation | PASS / FAIL | |
| T3 App restart + resume | PASS / FAIL | |
| T4 Multiple sessions isolation | PASS / FAIL | |
| T5 Error handling | PASS / FAIL | |

## Overall: PASS / FAIL

## Issues Found

*(list any failures, error messages, or unexpected behavior)*
```
