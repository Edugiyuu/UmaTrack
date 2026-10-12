# Learning Progress

## Fluxo de treino (frontend → API → banco)
- Introduced: caminho POST /user/me/horses/:horseId/train → authMiddleware → trainHorse → resolveTraining → user.save(); body é {trainType, score, maxScore}; servidor fixa custo de energia (20); estado salvo embutido em users.horses no MongoDB; JSON é formato de transporte, não armazenamento.
- Introduced: fronteira de confiança — navegador não envia valores que alteram o save diretamente.
- Learner model (before explanation): não sabia quem calcula; achava que o navegador enviava atributo + energia gasta; achava que o estado ficava "num JSON".
- Needs reinforcement: quem é dono de cada cálculo (cliente vs servidor); onde o estado persiste.

## Pending decision
- Checkpoint: Build checkpoint "confiança no score" — stage: awaiting reasoning. Perguntado ao aprendiz o que o servidor faz hoje para limitar um score forjado (userController.ts:272–285) e se/como reduziria o risco. Nenhuma mudança de código proposta.
