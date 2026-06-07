## Why

O app exibe "Hermes CLI failed (exit -1): no stderr output" sem nenhuma informação acionável — impossível diagnosticar falhas em produção. O bridge Rust precisa expor erros precisos e o frontend deve comunicá-los de forma útil ao usuário.

## What Changes

- **bridge.rs**: validar existência do binário antes de spawn; capturar stdout + stderr completos; incluir args no erro; retornar stdout tail quando stderr vazio.
- **lib.rs**: adicionar comando Tauri `check_hermes_status()` retornando `{ found, path, version, error }`.
- **App.tsx**: chamar `check_hermes_status()` na inicialização e exibir aviso inline se Hermes indisponível; substituir `alert()` do botão de anexo por toast inline.

## Capabilities

### New Capabilities

- `hermes-status-check`: Comando Tauri que valida presença e versão do Hermes CLI no ambiente de execução.

### Modified Capabilities

- `hermes-bridge`: Diagnósticos do bridge melhorados — captura de stderr/stdout, validação de binário, mensagens de erro acionáveis.

## Impact

- `src-tauri/src/bridge.rs`: lógica de spawn e tratamento de erros.
- `src-tauri/src/lib.rs`: registro do novo comando Tauri.
- `src/App.tsx`: startup check e remoção de `alert()`.
- `SMOKE_TEST_REPORT.md`: atualizado com resultados de validação.
