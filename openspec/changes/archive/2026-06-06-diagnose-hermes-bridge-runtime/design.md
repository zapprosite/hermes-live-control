## Context

O `HermesBridge` em `src-tauri/src/bridge.rs` faz spawn do CLI `hermes` via `tokio::process::Command`. Quando o processo falha, o erro retornado ao frontend é genérico ("exit -1: no stderr output"), sem revelar o path do binário, os args usados, ou qualquer saída capturada. Isso impossibilita diagnóstico remoto ou por usuário final.

O frontend em `src/App.tsx` usa `window.alert()` no botão de anexo, o que é bloqueante e apresenta texto técnico ("interop") ao usuário.

## Goals / Non-Goals

**Goals:**
- Bridge reporta path exato do binário, args, stdout tail e stderr em todos os erros.
- Bridge valida existência do binário antes de spawn (sem fork desnecessário).
- Novo comando Tauri `check_hermes_status` retorna estado do Hermes de forma estruturada.
- App verifica Hermes na inicialização e exibe aviso inline (não bloqueante).
- Substituir `alert()` do botão de anexo por feedback inline.

**Non-Goals:**
- Nenhuma integração com LiveKit, memória, skills ou PVC engine.
- Nenhuma nova tela ou rota de navegação.
- Nenhuma mudança em lógica de sessão ou streaming existente.

## Decisions

**D1 — Validação de binário com `which` / `PATH` walk antes do spawn**
Razão: evitar fork + wait de processo inexistente; permite mensagem clara "binary not found at <path>".
Alternativa descartada: confiar no `io::Error::NotFound` do spawn — menos informativo e ocorre após fork.

**D2 — Capturar stdout e stderr via `output()` (não `spawn()` com pipes manuais)**
Razão: `Command::output()` coleta ambos os streams de forma síncrona, sem risco de deadlock em buffers pequenos.
Alternativa descartada: `spawn()` + `wait_with_output()` — equivalente mas mais verboso sem benefício aqui.

**D3 — `check_hermes_status` como Tauri command separado (não acoplado ao chat)**
Razão: permite chamada independente no startup sem depender de sessão ativa; fácil de testar via Tauri devtools.

**D4 — Toast inline no frontend (não `alert()`, não biblioteca externa)**
Razão: manter zero-dependência adicional; UI mínima estilo ChatGPT; `alert()` é bloqueante e inapropriado.

## Risks / Trade-offs

- [PATH diferente no contexto Tauri vs terminal] → Usar `std::env::var("PATH")` explicitamente no log de diagnóstico para expor o PATH visto pelo processo filho.
- [Binário existe mas não é executável] → `std::fs::metadata` + `permissions().mode()` catch antes do spawn (Unix); no Windows, tentar e capturar o erro de acesso.
- [Stdout/stderr muito grandes] → Truncar ao último 1 KB para incluir no erro sem explodir payload.
