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
│   │   ├── 05-navegacao-telas.md
│   │   └── 06-sincronizacao.md
│   └── pesquisa/               # pesquisa, proposta e riscos da NASA (riscos-nasa-links-completo.md)
├── public/
│   └── icons/                  # o manifesto é gerado pelo vite-plugin-pwa
├── server/                     # backend na Terra: só guarda pacotes cifrados
│   ├── package.json            # Node 24, sem dependências
│   ├── README.md               # rotas, variáveis e como publicar no Railway
│   ├── src/
│   │   ├── index.js            # sobe o servidor
│   │   ├── app.js              # rotas, token da missão e CORS
│   │   ├── db.js               # SQLite (node:sqlite), um pacote por linha
│   │   └── validate.js         # recusa o que foge do formato do pacote
│   └── test/
│       └── app.test.js
└── src/
    ├── main.tsx                # ponto de entrada
    ├── App.tsx                 # rotas e layout base
    ├── i18n.ts                 # inglês padrão, português brasileiro e lang do documento
    ├── locales/
    │   ├── en/                 # traduções em inglês por área
    │   └── pt-BR/              # traduções em português brasileiro por área
    ├── types/
    │   └── index.ts            # todos os tipos de domínio
    ├── rules/
    │   ├── rules.json          # faixas, chaves dos textos de alerta e fontes
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
    │   ├── profilesRepo.ts     # perfis de entrada; guarda a chave de dados cifrada no PIN
    │   ├── keyring.ts          # chave de dados da sessão, só na memória
    │   ├── reviewsRepo.ts      # alertas vistos pelo oficial médico; conduta cifrada
    │   ├── accessLogRepo.ts    # registro de quem abriu os dados de quem
    │   ├── packetsRepo.ts      # pacotes para a Terra; conteúdo cifrado
    │   └── seed.ts             # 3 tripulantes, 4 perfis e 60 dias simulados
    ├── store/
    │   └── useAppStore.ts      # sessão, tripulante ativo, ambiente, alertas, sincronização
    ├── sync/
    │   ├── adapters.ts         # interfaces SyncAdapter e EarthLink
    │   ├── central.ts          # central de bordo e ligação com a Terra simuladas; ciclo de sincronização
    │   ├── httpEarthLink.ts    # EarthLink que envia ao backend (com VITE_EARTH_API_URL)
    │   ├── packets.ts          # monta o pacote, prioridade, ordem da fila e atraso
    │   └── sync.test.ts
    ├── hooks/
    │   ├── useIdleLock.ts      # bloqueia depois de um tempo sem uso
    │   └── useNow.ts           # hora atual, para contagens que mudam com o tempo
    ├── pages/
    │   ├── DashboardPage.tsx   # painel com o corpo humano
    │   ├── CheckinPage.tsx     # formulário diário guiado
    │   ├── AlertsPage.tsx      # alertas e ações
    │   ├── TrendsPage.tsx      # gráficos
    │   ├── MissionPage.tsx     # ambiente, lembretes, sequência de dias
    │   ├── LoginPage.tsx       # perfil + PIN
    │   ├── CrewOverviewPage.tsx # oficial médico: todos os tripulantes
    │   ├── CrewStatusPage.tsx  # comandante: só check-in e vermelho sim/não
    │   ├── SyncPage.tsx        # estado da sincronização, sem botões de ligar
    │   ├── GroundPage.tsx      # médico do solo: pacotes que chegaram à Terra
    │   ├── YourDataPage.tsx    # "Seus dados": cópia JSON, pedido de exclusão e registro de acesso
    │   ├── MedicalContactPage.tsx # mensagem por texto para mostrar ao oficial médico
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
    │   │   ├── AlertReviewBox.tsx # "visto pelo oficial médico" e conduta
    │   │   └── LevelBadge.tsx  # cor + ícone + texto
    │   ├── charts/
    │   │   └── IndicatorChart.tsx
    │   └── layout/
    │       ├── NavBar.tsx
    │       ├── CrewSwitcher.tsx # só para o oficial médico
    │       ├── UserMenu.tsx    # menu do avatar: missão, sincronização, seus dados, bloquear
    │       ├── LanguageSelect.tsx # troca de idioma
    │       └── Disclaimer.tsx
    ├── content/
    │   ├── indicators.ts       # chaves dos textos de indicadores, regiões e ambientes
    │   ├── format.ts           # valor de um indicador pronto para mostrar
    │   └── localize.ts         # traduz textos do domínio com chaves e parâmetros
    ├── lib/
    │   ├── dates.ts            # dia de missão, janelas de dias
    │   ├── format.ts           # números localizados com Intl
    │   ├── levels.ts           # ordenação e combinação de níveis
    │   ├── series.ts           # séries numéricas (pressão em duas) e faixas
    │   ├── access.ts           # quem vê o quê, por papel
    │   ├── crypto.ts           # AES-GCM, chave derivada do PIN (PBKDF2), base64
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
| `data/` | Guardar e ler dados no dispositivo, cifrando o dado de saúde | `types/`, `lib/` |
| `sync/` | Levar dados à central de bordo e à Terra | `types/`, `data/`, `rules/`, `lib/`, `content/` |
| `store/` | Estado da sessão em memória | `types/`, `data/`, `rules/`, `lib/`, `sync/` |
| `hooks/` | Hooks de React sem regra de negócio | nada |
| `content/` | Textos explicativos dos indicadores | `types/` |
| `pages/` | Uma tela por arquivo | tudo acima e `components/` |
| `components/` | Peças visuais reutilizáveis | `types/`, `content/`, `lib/` |
| `lib/` | Funções puras: datas, níveis, acesso e criptografia | `types/` |

`server/` fica fora de `src/` e não importa nada do app. Fala com ele só pelo HTTP.

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
11. Papéis, login e criptografia (`lib/access.ts`, `lib/crypto.ts`, repositórios novos, `LoginPage`)
12. Sincronização (`sync/`) e telas Tripulação, Sincronização e Visão do solo
13. Backend na Terra (`server/`)
