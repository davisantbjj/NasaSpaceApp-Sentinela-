# Diagrama 2: fluxo do check-in diário

Mostra o que acontece desde que o astronauta salva o check-in até o painel mudar de cor.

```mermaid
sequenceDiagram
    actor A as Astronauta
    participant C as CheckinPage
    participant S as useAppStore
    participant R as recordsRepo
    participant B as baseline.ts
    participant E as engine.ts
    participant D as DashboardPage

    A->>C: preenche os indicadores, passo a passo
    C->>S: saveCheckin(valores)
    S->>R: grava o DailyRecord do dia
    R-->>S: ok
    S->>R: busca o histórico do tripulante
    R-->>S: registros anteriores

    S->>B: computeBaselines(histórico)
    B-->>S: médias pessoais (em formação até 7 dias válidos)

    S->>E: evaluateRecord(registro, histórico, linhas de base, regras, ambiente)
    E-->>S: lista de alertas
    S->>E: levelByRegion(alertas)
    E-->>S: nível de cada região do corpo
    S->>E: findCorrelations(histórico, linhas de base, regras)
    E-->>S: indicadores que mudaram juntos

    S-->>C: resumo do dia
    C-->>A: mostra o resultado e os alertas novos
    S-->>D: regiões do corpo atualizadas
```

## Pontos importantes

- Existe um registro por tripulante por dia. Salvar de novo no mesmo dia substitui o anterior.
- A linha de base é recalculada do histórico, mas só usa os primeiros `baselineDays` dias válidos, então para de mudar quando fica pronta. Dias fora da faixa geral não entram no cálculo.
- O check-in só pede os indicadores da lista `trackedIndicators` do tripulante.
- Os alertas não são gravados no banco. São recalculados a cada check-in e a cada abertura do app.
- Nenhum passo usa rede.
