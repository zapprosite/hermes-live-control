# Task: TASK_001

## Context Budget
Estimativa: 15.000 tokens

## Description
O Hermes Live Control atua como uma interface para a "Hermes CLI". Esta tarefa requer a configuração do backend em Rust (Tauri v2) para habilitar chamadas IPC. O backend deve poder receber comandos do React e retornar respostas de sistema.

## Acceptance Criteria
- [ ] O arquivo `src-tauri/src/lib.rs` exporta um comando Tauri (ex: `invoke('execute_hermes_command', { prompt })`).
- [ ] O frontend no React chama o invoke ao enviar uma mensagem no Composer.
- [ ] Nenhum código visual extra deve ser implementado, apenas o fluxo de dados.

## Review Gate
O revisor verificará se a comunicação de ida e volta (Frontend -> Rust -> Frontend) funciona via testes no console.

## Next Task ID
TASK_002
