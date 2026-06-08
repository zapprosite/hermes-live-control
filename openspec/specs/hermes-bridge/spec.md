# Spec: hermes-bridge

## Purpose

The `hermes-bridge` module is responsible for spawning and communicating with the Hermes CLI process from within the Tauri backend. It handles process lifecycle, argument passing, output streaming, and error reporting.
## Requirements
### Requirement: Diagnóstico de falha do bridge
Quando o processo `hermes` falhar, o bridge SHALL retornar uma mensagem de erro que inclua: (1) o path absoluto do binário tentado, (2) os argumentos passados, (3) o exit code ou explicação de término anormal, (4) o conteúdo completo de stderr, e (5) se stderr estiver vazio, os últimos 1 KB de stdout.

O bridge SHALL validar a existência do binário antes de fazer spawn e retornar erro imediato com o PATH do ambiente se o binário não for encontrado.

#### Scenario: Binário não existe no PATH
- **WHEN** o bridge tenta invocar `hermes` e o binário não está presente
- **THEN** retorna erro: `"Hermes binary not found. PATH: <valor>. Expected binary: hermes"`

#### Scenario: Processo falha com stderr
- **WHEN** o processo `hermes` termina com exit code não-zero e stderr não-vazio
- **THEN** retorna erro contendo exit code, args usados e conteúdo do stderr

#### Scenario: Processo falha sem stderr
- **WHEN** o processo `hermes` termina com exit code não-zero e stderr vazio
- **THEN** retorna erro contendo exit code, args usados e últimos 1 KB de stdout (ou "(no output)" se stdout também vazio)

#### Scenario: Processo terminado por sinal
- **WHEN** o processo `hermes` é terminado por sinal (sem exit code)
- **THEN** retorna erro: `"Process terminated by signal. Args: <args>. stderr: <conteúdo>"`

### Requirement: Log do path do binário em modo debug
O bridge SHALL logar via `eprintln!` ou `log::debug!` o path absoluto do binário e os args antes de cada invocação, para facilitar diagnóstico em builds de desenvolvimento.

#### Scenario: Log antes do spawn
- **WHEN** o bridge inicia uma invocação do Hermes CLI
- **THEN** emite log de nível debug com path e args antes do spawn

### Requirement: HermesBridge module encapsulates CLI invocation
The system SHALL implement a `HermesBridge` struct in `src-tauri/src/bridge.rs` that is the single owner of all Hermes CLI invocation logic.

#### Scenario: Bridge resolves CLI path on construction
- **WHEN** `HermesBridge::new()` is called
- **THEN** it SHALL check `/home/will/.local/bin/hermes` first, then `$PATH` via `which hermes`, and return `Ok(HermesBridge)` if found or `Err(String)` with a descriptive message if not

#### Scenario: Bridge returns error when CLI not found
- **WHEN** neither the primary path nor `$PATH` contains the hermes binary
- **THEN** `HermesBridge::new()` SHALL return `Err("Hermes CLI not found …")` and the `send_message` command SHALL propagate this error to the frontend

### Requirement: Session ID captured via --pass-session-id
The bridge SHALL pass `--pass-session-id` on every CLI invocation so the session ID can be read from the first stdout line without querying `sessions list`.

#### Scenario: Session ID extracted from first stdout line
- **WHEN** the CLI outputs a line matching `SESSION_ID=<value>` as the first non-empty stdout line
- **THEN** the bridge SHALL parse `<value>` and return it alongside the response content

#### Scenario: Missing SESSION_ID line handled gracefully
- **WHEN** no `SESSION_ID=` line appears in stdout
- **THEN** the bridge SHALL proceed without a session ID rather than returning an error

### Requirement: Existing CLI session resumed via --resume flag
When a session already has a `cli_session_id` from a previous turn, the bridge SHALL pass `--resume <cli_session_id>` so the Hermes CLI continues the same conversation thread.

#### Scenario: Resume flag added when session ID exists
- **WHEN** `session.cli_session_id` is `Some(id)`
- **THEN** the CLI invocation SHALL include `--resume <id>` and SHALL NOT create a new CLI session

#### Scenario: No resume flag on first message
- **WHEN** `session.cli_session_id` is `None`
- **THEN** the CLI invocation SHALL omit `--resume` and SHALL create a new CLI session

### Requirement: Non-zero CLI exit is a typed error
The bridge SHALL treat a non-zero CLI exit code as a hard error and return it to the caller with the stderr payload.

#### Scenario: Stderr surfaced on failure
- **WHEN** the CLI exits with a non-zero exit code
- **THEN** the `send_message` Tauri command SHALL return `Err("Hermes CLI failed: <stderr>")` and no assistant message SHALL be appended to the session

### Requirement: Session JSON updated atomically after response
After a successful CLI invocation, the session file SHALL be updated with the new `cli_session_id` (if newly captured) and the assistant message appended, in a single `save_session` call.

#### Scenario: Single file write per send_message
- **WHEN** `send_message` completes successfully
- **THEN** exactly one write to the session JSON file SHALL occur after both user and assistant messages are appended

