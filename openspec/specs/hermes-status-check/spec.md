# Spec: hermes-status-check

## Purpose

The `hermes-status-check` capability exposes a Tauri command to verify whether the Hermes CLI binary is available in the system PATH, returning diagnostic information used to surface errors to the user during app startup.

## Requirements

### Requirement: Verificação de status do Hermes CLI
O sistema SHALL expor um comando Tauri `check_hermes_status` que retorna se o binário `hermes` está disponível no PATH, seu caminho absoluto, sua versão (via `hermes --version`) e qualquer erro encontrado.

O retorno SHALL seguir a estrutura:
```json
{
  "found": boolean,
  "path": string | null,
  "version": string | null,
  "error": string | null
}
```

#### Scenario: Hermes disponível e funcional
- **WHEN** `check_hermes_status` é invocado e `hermes` está no PATH
- **THEN** retorna `{ found: true, path: "<caminho absoluto>", version: "<saída de --version>", error: null }`

#### Scenario: Hermes não encontrado no PATH
- **WHEN** `check_hermes_status` é invocado e `hermes` não está no PATH
- **THEN** retorna `{ found: false, path: null, version: null, error: "hermes binary not found in PATH: <PATH value>" }`

#### Scenario: Hermes encontrado mas falha ao executar
- **WHEN** `check_hermes_status` é invocado, binário existe mas `hermes --version` falha
- **THEN** retorna `{ found: true, path: "<caminho>", version: null, error: "<stderr ou exit code>" }`

### Requirement: Verificação na inicialização do app
O sistema SHALL chamar `check_hermes_status` automaticamente durante a inicialização do frontend e SHALL exibir um aviso inline não-bloqueante se o resultado indicar `found: false` ou `error` não nulo.

#### Scenario: Hermes indisponível no startup
- **WHEN** o app inicializa e `check_hermes_status` retorna `found: false`
- **THEN** exibe mensagem inline "Hermes CLI não encontrado. Verifique sua instalação." sem bloquear a UI

#### Scenario: Hermes disponível no startup
- **WHEN** o app inicializa e `check_hermes_status` retorna `found: true`
- **THEN** nenhuma mensagem de aviso é exibida
