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
| 10 | Pontos da reunião da equipe (14/11) | A fazer, dividido por pessoa |

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

## Fase 10: pontos da reunião da equipe (14/11)

Tarefas tiradas do documento de respostas aos pontos que a equipe levantou na reunião de 14/11. O documento é interno e não fica no repositório; peçam ao Davi.

A divisão é uma sugestão: troquem entre vocês se preferirem, só atualizem o nome aqui. Marquem `[x]` ao terminar.

### Primeiro: decisões da equipe (todos)

Estas tarefas travam outras. Até a equipe decidir, as tarefas marcadas com 🔒 ficam paradas.

- [ ] **D1. Central de bordo:** simulada no navegador (recomendado: sem servidor, menos risco no dia) ou servidor real na rede local (Node + SQLite)?
- [ ] **D2. Comandante:** vê só "check-in feito ou pendente" e se há alerta vermelho, ou não vê nada?
- [ ] **D3. Regiões do corpo:** passar de 7 para 5 (mente e sono; olhos e visão; coração e circulação; ossos e músculos; corpo inteiro)?
- [ ] **D4. Predição:** projeção linear simples na tela de tendências, com o rótulo "projeção, não previsão", ou o app só mede e compara?

Depois das decisões, o Davi atualiza `CONTEXTO-IA.md`, `docs/arquitetura.md` e os diagramas.

### Ordem sugerida

1. A Lorena monta o i18n primeiro: depois disso todo texto novo já entra como chave, em inglês e português.
2. O Davi faz papéis e login: o escalonamento, as telas por papel e o registro de acesso dependem disso.
3. O resto anda em paralelo.

### Davi: papéis, login, segurança e central de bordo

- [ ] Papéis: tripulante (vê só os próprios dados), oficial médico (vê todos), médico do solo (vê todos, com atraso, só leitura) e comandante (🔒 D2)
- [ ] Tela de entrada: escolha de perfil + PIN de 4 a 6 dígitos, permitindo colar e usar gerenciador de senha (WCAG 3.3.8)
- [ ] Bloqueio após alguns minutos sem uso e ao trocar de tripulante
- [ ] Criptografar os registros no IndexedDB (Web Crypto, AES-GCM, chave derivada do PIN)
- [ ] Registro de acesso: cada vez que o oficial médico ou o solo abre os dados de alguém, fica um registro visível para o tripulante
- [ ] Tela do oficial médico: grade com todos os tripulantes (nível geral, check-in feito ou pendente, alertas abertos), marcar alerta como "visto" e anotar conduta
- [ ] 🔒 D1. Interface `SyncAdapter` com implementação local e tela de "sincronização" mostrando a fila indo para a central
- [ ] 🔒 D1. Pacote diário por tripulante para o solo (resumo, alertas, anotações), vermelho no topo da fila
- [ ] 🔒 D1. Tela "Visão do solo": mesma grade do oficial médico, com hora do dado, hora de chegada e aviso de atraso
- [ ] 🔒 D3. Passar o mapa do corpo para 5 regiões: `REGIONS` e `rules.json`, e refazer as formas das figuras masculina **e** feminina em `bodyRegions.ts`
- [ ] 🔒 D3. Na figura: marcador só nas regiões amarelas e vermelhas, selo de "corpo inteiro" ao lado da figura em vez do contorno, área de toque maior na cabeça

### Talita: acessibilidade, layout e alarmes

- [ ] Contraste em `src/styles/tokens.css`: `--text-faint` para `#8f9dba` e `--level-none` para `#8494b0`
- [ ] Fontes de 11 px (barra inferior do celular e contadores) para no mínimo 12 px, de preferência 14 px
- [ ] Botão "Texto maior", que aumenta a escala base da fonte
- [ ] Testar com zoom de 200%, largura de 320 px e espaçamento de texto aumentado (WCAG 1.4.4, 1.4.10 e 1.4.12)
- [ ] Layout no desktop: lista de regiões alinhada ao topo; chip "Estação" vira "Ambiente: Estação"
- [ ] Layout no celular: figura menor ou resumo antes dela ("1 região para acompanhar"); nome do tripulante sem corte (cargo na segunda linha); cabeçalho com fundo opaco
- [ ] Alarmes com Web Audio, sem arquivos de som: toque curto no amarelo, padrão repetido no vermelho até alguém confirmar
- [ ] Equivalente visual de todo som: banner fixo com cor, ícone e texto, contador na barra e vibração no celular
- [ ] Botão "Silenciar" no banner e volume por nível na tela de missão (WCAG 1.4.2). O vermelho pode ser silenciado, mas o banner só sai quando alguém confirma
- [ ] Nada piscando mais de 3 vezes por segundo (WCAG 2.3.1)
- [ ] Passada com leitor de tela e só teclado (fase 9)

### Lorena: idiomas, horários e escalonamento

- [ ] i18n com `react-i18next`: inglês como padrão e português como tradução, arquivos em `src/locales/en/` e `src/locales/pt-BR/` por área (comum, check-in, alertas, indicadores)
- [ ] Passar para chaves os textos de `src/content/indicators.ts`, das telas e os textos de alerta do `rules.json` (as faixas numéricas ficam no `rules.json`)
- [ ] Datas e números com `Intl` (5.2 h em inglês, 5,2 h em português); a digitação continua aceitando vírgula e ponto
- [ ] Atualizar o `lang` do `<html>` ao trocar de idioma (WCAG 3.1.1) e um teste que falha se faltar chave em um dos idiomas
- [ ] Horário do check-in por tripulante na tela de missão, com lembrete antes, alerta de atraso e aviso ao oficial médico se o atraso passar do limite
- [ ] Lembrete recorrente "a cada X horas" (ex.: hidratação), com banner e som; os lembretes atuais "a cada N dias" continuam como opção
- [ ] Notificação do sistema quando a aba está em segundo plano e, ao abrir o app, conferir o que ficou atrasado
- [ ] Escalonamento por nível (depende dos papéis do Davi): amarelo entra no resumo do oficial médico; amarelo por 3 dias vira pendência dele; vermelho e sintoma vermelho avisam na hora e mostram "Chame o oficial médico agora"
- [ ] Texto do vermelho por ambiente: na estação "o solo será avisado no próximo contato"; em Marte "a decisão é de bordo; o solo recebe em cerca de N minutos"
- [ ] 🔒 D4. Projeção linear na tela de tendências ("se continuar no ritmo dos últimos 7 dias, sai da faixa em cerca de N dias"), com confiança baixa e rótulo "projeção, não previsão"

### Larissa: pesquisa, LGPD e apresentação

- [ ] Revisão das faixas (fase 2), com a fonte de cada faixa citada no `rules.json`
- [ ] Nota de contexto pelo sexo do tripulante (ex.: ao voltar à gravidade, atenção à tontura ao levantar). Nenhuma faixa muda; o campo `sex` já existe
- [ ] Texto e tela "Seus dados": o que é coletado, para quê, quem vê, exportar em JSON e pedir exclusão (LGPD, art. 18)
- [ ] Aviso de primeira entrada com finalidade e base legal (tutela da saúde, art. 11, II, f)
- [ ] Mensagem de texto para o oficial médico como alternativa a chamada (para quem não fala)
- [ ] Seção da apresentação: como a NASA mede (Standard Measures, actigrafia, questionários, sangue e urina, dosímetros, conferência médica semanal) e onde o Sentinela entra
- [ ] Seção da apresentação: por que os dados são simulados (não existe série diária pública de sinais vitais de astronautas)
- [ ] Seção da apresentação: o que muda em cada ambiente (gravidade, atraso, radiação, evacuação) e que há pouca evidência humana para Lua e Marte
- [ ] Deixar claro na apresentação: o app mede e compara, não prediz; a autenticação real seria a da agência
- [ ] Roteiro da demonstração, vídeo ou slides e envio no site do Space Apps (fase 9)

## Limitações conhecidas

- Os dados ficam só no navegador onde o app foi aberto; outro navegador começa com a demonstração de novo.
- O "aviso ao solo" é só uma marcação no alerta; não há envio.
- Os lembretes aparecem na tela de missão; não há notificação do sistema.
- O IndexedDB não criptografa os dados. Num produto real isso seria obrigatório.
