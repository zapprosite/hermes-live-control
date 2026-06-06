# Task: TASK_003

## Context Budget
Estimativa: 10.000 tokens

## Description
O PRD especifica que o usuário pode navegar por Sessões e gerenciar Memória. Esta tarefa implementa o armazenamento local de contexto e um gerenciador de estado (ex: Zustand) para segurar a "Conversa Atual".

## Acceptance Criteria
- [ ] Criação do `src/store/chatStore.ts` com Zustand.
- [ ] A interface do App.tsx passa a exibir as mensagens enviadas usando a store do React.
- [ ] Histórico de mensagens é persistido (ex: `tauri-plugin-store` ou localStorage temporariamente).

## Review Gate
Verificar se atualizar o frontend (refresh) não perde o histórico e se o scroll foca na última mensagem enviada.

## Next Task ID
FINAL (Ready for /opsx-archive)
