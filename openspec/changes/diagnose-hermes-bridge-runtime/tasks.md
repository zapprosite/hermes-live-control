## 1. Rust Bridge — Diagnósticos e Validação

- [x] 1.1 Em `bridge.rs`: logar path do binário e args antes do spawn via `eprintln!`
- [x] 1.2 Em `bridge.rs`: validar existência do binário com `which::which("hermes")` ou fallback manual; retornar erro com PATH se não encontrado
- [x] 1.3 Em `bridge.rs`: substituir captura de saída por `Command::output()` para coletar stdout + stderr completos
- [x] 1.4 Em `bridge.rs`: construir mensagem de erro com exit code, args, stderr e (se stderr vazio) últimos 1 KB de stdout

## 2. Tauri Command — check_hermes_status

- [x] 2.1 Em `lib.rs`: implementar `check_hermes_status()` que resolve path do binário, executa `hermes --version` e retorna struct `HermesStatus { found, path, version, error }`
- [x] 2.2 Em `lib.rs`: registrar `check_hermes_status` no `tauri::Builder::invoke_handler`

## 3. Frontend — Startup Check e Remoção de alert()

- [x] 3.1 Em `App.tsx`: chamar `invoke("check_hermes_status")` no `useEffect` de inicialização e armazenar resultado em estado
- [x] 3.2 Em `App.tsx`: exibir aviso inline não-bloqueante se `found === false` ou `error !== null`
- [x] 3.3 Em `App.tsx`: substituir `alert("File attachment interop is active.")` por toast/status inline
- [x] 3.4 Executar `npm run build` e `cargo build` e confirmar sem erros
- [x] 3.5 Atualizar `SMOKE_TEST_REPORT.md` com resultado de `hermes --version` e envio de mensagem de teste (PASS/FAIL)
