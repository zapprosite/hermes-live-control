## Why

The `hermes-bridge-foundation` change delivered `HermesBridge`, streaming via `hermes://chunk`, session persistence, and the `--resume` / `sessions list` pipeline. These components have never been exercised end-to-end in a running application. Before archiving the foundation change and opening `memory-foundation`, the complete Hermes conversation lifecycle must be validated manually against a live build.

This change produces a structured `SMOKE_TEST_REPORT.md` and no production code.

## What Changes

- **No production code is modified.**
- A `SMOKE_TEST_REPORT.md` file is created in the change root documenting PASS / FAIL for every scenario.

## Capabilities

*(none — validation only)*

## Test Scope

Five scenarios covering the full lifecycle:

| # | Scenario | What is validated |
|---|---|---|
| T1 | New conversation | Bridge invokes CLI, response streams, session saved |
| T2 | Continue conversation | `cli_session_id` captured, `-r` flag passed, Hermes retains context |
| T3 | App restart + resume | Session JSON persists across restarts, `--resume` reloads context |
| T4 | Multiple sessions | Session isolation — no cross-contamination between session A and B |
| T5 | Error handling | Missing binary surfaces as error bubble; no fake response generated |

## Impact

- **Production code**: none.
- **Deliverable**: `SMOKE_TEST_REPORT.md` with PASS / FAIL per scenario.
- **Gate**: All five PASS → archive `hermes-bridge-foundation` → open `memory-foundation`.
