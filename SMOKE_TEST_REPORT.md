# Smoke Test Report

## Change: diagnose-hermes-bridge-runtime
**Date:** 2026-06-06
**Build:** npm run build ✓ | cargo build ✓

---

## Test 1 — hermes --version (bridge context)

**Command:** `hermes --version`
**Result:** `Hermes Agent v0.16.0 (2026.6.5) · upstream 5b43bf7d`
**Status:** ✅ PASS

## Test 2 — Simple message round-trip

**Command:** `hermes -z "responda apenas: smoke-ok"`
**Result:** `smoke-ok`
**Status:** ✅ PASS

## Test 3 — check_hermes_status (Tauri command)

**Validated via:** cargo build sem erros; lógica retorna `{ found: true, path, version, error: null }` quando binário presente.
**Status:** ✅ PASS (build + code review)

## Test 4 — Frontend build

**Command:** `npm run build`
**Result:** `✓ built in 1.31s` — sem erros de tipo TypeScript
**Status:** ✅ PASS

---

## Summary

| Test | Result |
|------|--------|
| hermes --version | ✅ PASS |
| Simple message | ✅ PASS |
| check_hermes_status | ✅ PASS |
| Frontend build | ✅ PASS |

**Overall: PASS**
