# Tarefas do Sentinela

Estado do projeto: o que já foi feito e o que falta. As fases seguem a ordem de implementação de `docs/estrutura-do-projeto.md`.

Atualizado em 2026-11-14.

| Fase | Assunto | Estado |
| --- | --- | --- |
| 0 | Pesquisa e documentação | Feito |
| 1 | Estrutura do projeto | Feito |
| 2 | Motor de regras | Feito (faixas precisam de revisão) |
| 3 | Dados e estado | Feito |
| 4 | Check-in diário | Feito |
| 5 | Painel com o corpo humano | Feito |
| 6 | Alertas e ações | Feito |
| 7 | Tendências, missão e correlações | Feito |
| 8 | PWA e publicação | Começado |
| 9 | Entrega do hackathon | A fazer |

## Fase 0: pesquisa e documentação (feito)

- [x] Pesquisa sobre riscos de saúde em missões longas (`docs/pesquisa/`)
- [x] Proposta do projeto para o Space Apps 2026 (`docs/pesquisa/proposta-space-apps-2026.md`)
- [x] Contexto para assistentes de IA (`CONTEXTO-IA.md`)
- [x] Arquitetura, tipos de dados e convenções (`docs/arquitetura.md`)
- [x] Estrutura de pastas (`docs/estrutura-do-projeto.md`)
- [x] Cinco diagramas (`docs/diagramas/`)

## Fase 1: estrutura do projeto (feito)

- [x] Projeto Vite + React 18 + TypeScript, com React Router, Zustand, Dexie, Recharts, vite-plugin-pwa e Vitest
- [x] Árvore de pastas de `src/`, tipos de domínio e utilitários puros com teste
- [x] Repositório no GitHub (privado), `.gitignore` e CI no GitHub Actions (`.github/workflows/ci.yml`)

## Fase 2: motor de regras (feito)

- [x] `rules.json` com os dez indicadores, a lista de sintomas, as notas de ambiente e os pares de correlação
- [x] `computeBaselines` (`src/rules/baseline.ts`): primeiros 7 dias válidos, descarta dias fora da faixa geral, pressão em duas séries
- [x] `evaluateRecord` e `levelByRegion` (`src/rules/engine.ts`): pior nível entre faixa geral e desvio pessoal mantido por 3 dias, alerta com as seis partes, confiança baixa com linha de base em formação, aviso ao solo no vermelho
- [x] `findCorrelations` (`src/rules/correlation.ts`): "mudaram juntos", sem afirmar causa
- [x] 29 testes passando (`npm test`)
- [ ] **Revisão da equipe**: as faixas verdes de pressão, frequência, glicemia, temperatura e sono vêm de `docs/pesquisa/`. Estas foram **escolhidas por mim para a demonstração** e precisam de confirmação:
  - todas as faixas amarelas;
  - a faixa verde de pressão por número (sistólica de 100 a 130 e diastólica de 60 a 85; a pesquisa só diz "perto de 120/80");
  - exercício (verde de 60 a 150 min; a pesquisa cita cerca de 90 min por dia, mas diz que não é meta universal);
  - humor (4 e 5 são verdes, 3 é amarelo);
  - visão (1 é amarelo, 2 é vermelho);
  - o nível de cada sintoma (dor no peito e falta de ar são vermelhos; os outros, amarelos).

## Fase 3: dados e estado (feito)

- [x] Banco local com três tabelas (`crew`, `records`, `settings`). A linha de base deixou de ser gravada: é recalculada dos registros, como os alertas
- [x] Repositórios `recordsRepo`, `crewRepo` e `settingsRepo`
- [x] `seed.ts`: três tripulantes fictícios e 60 dias terminando ontem, com dois casos preparados:
  - Ana: o sono cai por 7 dias e o humor cai junto;
  - Lia: mudança leve na visão e dor de cabeça;
  - Kenji: tudo normal, e é o único que acompanha glicemia.
- [x] Store Zustand com `loadCrew`, `saveCheckin`, `setEnvironment`, `switchCrew`, `setReminder` e `resetDemo`
- [x] Seletor de tripulante e ambiente atual na barra de navegação

## Fase 4: check-in diário (feito)

- [x] Textos "como medir" e "por que medir" dos dez indicadores (`src/content/indicators.ts`)
- [x] Passos para número, escala e lista de marcar; um indicador por passo, só os acompanhados, qualquer passo pode ser pulado
- [x] Validação de digitação (aceita vírgula), revisão antes de salvar e resumo com os alertas do dia
- [x] Refazer o check-in do mesmo dia substitui o registro

## Fase 5: painel com o corpo humano (feito)

- [x] Figura humana em SVG com sete regiões clicáveis e acessíveis pelo teclado, com ícone além da cor
- [x] Lista de regiões ao lado da figura e painel de detalhe com valor, nível, linha de base e atalhos
- [x] Aviso de check-in pendente

## Fase 6: alertas e ações (feito)

- [x] Cartão com as seis partes, nota do ambiente e marcação de aviso ao solo
- [x] Tela de alertas com resumo por nível e seção "Mudaram juntos"

## Fase 7: tendências, missão e correlações (feito)

- [x] Gráfico com faixa geral sombreada, linha de base tracejada, dica ao passar o mouse e tabela de valores; períodos de 14, 30 e 60 dias
- [x] Tela de missão: ambiente, dia da missão, sequência de check-ins, lembretes por indicador e recriar a demonstração
- [x] Correlações no painel da região e na tela de alertas

## Fase 8: PWA e publicação (começado)

- [x] `vite-plugin-pwa` configurado, com manifesto e ícone SVG
- [x] Tela de tendências carregada sob demanda (o build não passa de 500 kB por arquivo)
- [ ] Ícones PNG de 192 e 512 px, para o app ser instalável em todos os navegadores
- [ ] Testar o uso sem rede no build de produção (`npm run build` e `npm run preview`)
- [ ] Escolher Vercel ou GitHub Pages e publicar (no GitHub Pages é preciso ajustar `base` em `vite.config.ts`)
- [ ] Rever os avisos do `npm audit` (baixos e moderados, em dependências do build do PWA e no `react-router` 6)

## Fase 9: entrega do hackathon

- [ ] Revisão das faixas pela equipe (ver fase 2)
- [ ] Passada de acessibilidade com leitor de tela e só teclado
- [ ] Roteiro da demonstração (sugestão: Ana no painel → mente e sono → alertas → tendência do sono → trocar ambiente para Marte e mostrar que o nível não muda → check-in da Lia)
- [ ] Capturas de tela e link do app publicado no `README.md`
- [ ] Escolher a licença do repositório
- [ ] Vídeo ou slides e envio no site do Space Apps

## Limitações conhecidas

- Os dados ficam só no navegador onde o app foi aberto; outro navegador começa com a demonstração de novo.
- O "aviso ao solo" é só uma marcação no alerta; não há envio.
- Os lembretes aparecem na tela de missão; não há notificação do sistema.
- O IndexedDB não criptografa os dados. Num produto real isso seria obrigatório.
