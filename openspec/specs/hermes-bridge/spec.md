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
