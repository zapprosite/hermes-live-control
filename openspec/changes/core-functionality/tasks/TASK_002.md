# Task: TASK_002

## Context Budget
Estimativa: 20.000 tokens

## Description
Conectar o "Live Voice Orb" (botão de microfone/orbit da UI minimalista) com o SDK do LiveKit no lado do React. Ao clicar, a aplicação deve solicitar permissões de microfone e iniciar uma sessão de áudio em tempo real com o servidor.

## Acceptance Criteria
- [ ] A biblioteca `@livekit/components-react` e dependências relacionadas são instaladas.
- [ ] O botão do Orbit altera o estado `isLiveVoice` e conecta ao LiveKit Room.
- [ ] A UI reage aos eventos da sala de áudio (Speaking, Thinking, Listening) de forma minimalista sem visualizadores de onda (waveforms) complexos.

## Review Gate
O revisor garantirá que a câmera não é acionada e que o fallback de SSE não entra em conflito com o WebSocket do LiveKit.

## Next Task ID
TASK_003
