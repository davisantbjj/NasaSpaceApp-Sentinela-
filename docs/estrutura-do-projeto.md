# Estrutura do projeto

Adições de Larissa (14/11): `src/data/privacyRepo.ts` e `messagesRepo.ts` encapsulam privacidade e mensagens; `src/content/privacy.ts` e `crewContext.ts` guardam textos; `src/components/layout/PrivacyNotice.tsx` apresenta o aviso inicial; `src/pages/YourDataPage.tsx` e `MedicalContactPage.tsx` implementam as novas rotas. Documentação em `docs/privacidade.md`, `docs/pesquisa/revisao-faixas.md`, `docs/apresentacao.md` e `docs/roteiro-demonstracao.md`. As tabelas e rotas originais abaixo são complementadas por essas adições.

## Árvore de pastas

```
sentinela/
├── CONTEXTO-IA.md              # entrada para assistentes de IA
├── README.md                   # apresentação para jurados e visitantes
├── TASKS.md                    # tarefas feitas e pendentes
├── .github/workflows/ci.yml    # tipos, testes e build a cada push
├── index.html
├── package.json
├── vite.config.ts              # inclui vite-plugin-pwa
├── tsconfig.json
├── docs/
│   ├── como-funciona.md        # explicação completa do funcionamento
│   ├── estrutura-do-projeto.md
│   ├── arquitetura.md
│   ├── diagramas/
│   │   ├── 01-visao-geral.md
│   │   ├── 02-fluxo-checkin.md
│   │   ├── 03-modelo-de-dados.md
│   │   ├── 04-niveis-de-alerta.md
│   │   └── 05-navegacao-telas.md
│   └── pesquisa/               # pesquisa, proposta e riscos da NASA (riscos-nasa-links-completo.md)
├── public/
│   └── icons/                  # o manifesto é gerado pelo vite-plugin-pwa
└── src/
    ├── main.tsx                # ponto de entrada
    ├── App.tsx                 # rotas e layout base
    ├── types/
    │   └── index.ts            # todos os tipos de domínio
    ├── rules/
    │   ├── rules.json          # faixas, textos de alerta e fontes
    │   ├── rules.ts            # exporta o rules.json com tipo
    │   ├── engine.ts           # avalia um registro e devolve alertas
    │   ├── baseline.ts         # calcula a linha de base pessoal
    │   ├── correlation.ts      # indicadores que mudaram juntos
    │   └── engine.test.ts
    ├── data/
    │   ├── db.ts               # esquema do Dexie
    │   ├── recordsRepo.ts      # leitura e gravação de registros diários
    │   ├── crewRepo.ts         # tripulantes
    │   ├── settingsRepo.ts     # ambiente da missão e lembretes
    │   └── seed.ts             # 3 tripulantes fictícios e 60 dias simulados
    ├── store/
    │   └── useAppStore.ts      # tripulante ativo, ambiente, alertas em memória
    ├── pages/
    │   ├── DashboardPage.tsx   # painel com o corpo humano
    │   ├── CheckinPage.tsx     # formulário diário guiado
    │   ├── AlertsPage.tsx      # alertas e ações
    │   ├── TrendsPage.tsx      # gráficos
    │   ├── MissionPage.tsx     # ambiente, lembretes, sequência de dias
    │   └── helpers.ts          # textos de linha de base e listas usadas pelas telas
    ├── components/
    │   ├── body/
    │   │   ├── BodyMap.tsx     # SVG com regiões clicáveis
    │   │   ├── bodyRegions.ts  # caminhos do SVG por região
    │   │   └── RegionPanel.tsx # detalhe da região selecionada
    │   ├── checkin/
    │   │   ├── StepShell.tsx   # moldura de cada passo
    │   │   ├── NumberStep.tsx
    │   │   ├── ScaleStep.tsx   # humor e visão
    │   │   └── ChecklistStep.tsx
    │   ├── alerts/
    │   │   ├── AlertCard.tsx
    │   │   └── LevelBadge.tsx  # cor + ícone + texto
    │   ├── charts/
    │   │   └── IndicatorChart.tsx
    │   └── layout/
    │       ├── NavBar.tsx
    │       ├── CrewSwitcher.tsx
    │       └── Disclaimer.tsx
    ├── content/
    │   ├── indicators.ts       # nome, unidade, como medir, por que medir, regiões, ambientes
    │   └── format.ts           # valor de um indicador pronto para mostrar
    ├── lib/
    │   ├── dates.ts            # dia de missão, janelas de dias
    │   ├── levels.ts           # ordenação e combinação de níveis
    │   ├── series.ts           # séries numéricas (pressão em duas) e faixas
    │   └── lib.test.ts
    └── styles/
        ├── tokens.css          # cores dos níveis e variáveis visuais
        └── app.css             # estilos das telas
```

## Papel de cada pasta em `src/`

| Pasta | Responsabilidade | Pode depender de |
| --- | --- | --- |
| `types/` | Tipos de domínio | nada |
| `rules/` | Decidir o nível de cada indicador e montar alertas | `types/`, `lib/` |
| `data/` | Guardar e ler dados no dispositivo | `types/` |
| `store/` | Estado da sessão em memória | `types/`, `data/`, `rules/` |
| `content/` | Textos explicativos dos indicadores | `types/` |
| `pages/` | Uma tela por arquivo | tudo acima e `components/` |
| `components/` | Peças visuais reutilizáveis | `types/`, `content/`, `lib/` |
| `lib/` | Funções utilitárias puras | `types/` |

Regra de dependência: `components/` não importa de `data/` nem de `rules/`. Quem busca dados e roda regras são as páginas e o store, que passam o resultado por props.

## Ordem sugerida de implementação

1. `types/index.ts`
2. `rules/rules.json`, `rules/baseline.ts`, `rules/engine.ts` e o teste; `rules/correlation.ts` depois do painel, se der tempo
3. `data/db.ts`, repositórios e `data/seed.ts`
4. `store/useAppStore.ts`
5. `pages/CheckinPage.tsx` com os componentes de `checkin/`
6. `components/body/` e `pages/DashboardPage.tsx`
7. `pages/AlertsPage.tsx`
8. `pages/TrendsPage.tsx`
9. `pages/MissionPage.tsx`
10. PWA e publicação
