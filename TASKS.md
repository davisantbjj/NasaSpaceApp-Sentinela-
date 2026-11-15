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
| 11 | Melhorias alinhadas ao desafio oficial | A fazer |

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
- [x] Ícones PNG de 192 e 512 px (mais o maskable para Android e o apple-touch-icon de 180 px para iPhone), para o app ser instalável em todos os navegadores
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

- [x] **D1. Central de bordo:** simulada no navegador. A sincronização é automática, sem opção de ligar ou desligar. Além disso, um backend simples na Terra guarda e sincroniza os pacotes (só isso), para a tripulação não perder dados em longos períodos sem comunicação.
- [x] **D2. Comandante:** decidido: vê só "check-in feito ou pendente" e se há alerta vermelho (sim/não). Dos próprios dados vê tudo, como tripulante.
- [ ] **D3. Regiões do corpo:** passar de 7 para 5 (mente e sono; olhos e visão; coração e circulação; ossos e músculos; corpo inteiro)? Chegou a ser feito e foi desfeito: a equipe quer o painel como era.
- [ ] **D4. Predição:** projeção linear simples na tela de tendências, com o rótulo "projeção, não previsão", ou o app só mede e compara? Recomendação (14/11): só medir e comparar, como já diz `docs/apresentacao.md`.

`CONTEXTO-IA.md`, `docs/arquitetura.md` e os diagramas já refletem as decisões D1 e D2.

### Ordem sugerida

1. A Lorena monta o i18n primeiro: depois disso todo texto novo já entra como chave, em inglês e português.
2. O Davi faz papéis e login: o escalonamento, as telas por papel e o registro de acesso dependem disso.
3. O resto anda em paralelo.

### Davi: papéis, login, segurança e central de bordo

Revisado em 15/11 considerando a fase 11 inteira (M1 a M11) como feita. Tarefas novas marcadas com **(fase 11)**.

- [x] Papéis: tripulante (só os próprios dados), oficial médico de bordo (todos; Kenji na demo) e médico do solo (só os pacotes que chegaram à Terra) (`src/lib/access.ts`)
- [x] 🔒 D2. Papel de comandante (Ana na demo): tela Tripulação só com check-in feito/pendente e alerta vermelho sim/não (`CrewStatusPage`, `loadCrewStatus`); a consulta entra no registro de acesso
- [x] Tela de entrada com perfil + PIN de 4 a 6 dígitos, aceitando colar e gerenciador de senha; pausa de 30 s depois de 5 PINs errados (`LoginPage`)
- [x] Bloqueio depois de 5 minutos sem uso e botão "Bloquear e trocar de perfil" no menu do usuário
- [x] Registros, anotações e pacotes cifrados no IndexedDB (AES-GCM). Uma chave de dados guardada cifrada no PIN de cada perfil (PBKDF2); o PIN não é gravado (`src/lib/crypto.ts`)
- [x] Registro de acesso: oficial médico e solo abrindo dados de alguém ficam registrados; o tripulante vê em "Seus dados" (`YourDataPage`)
- [x] Tela "Tripulação" do oficial médico: nível geral, check-in de hoje, alertas não vistos; "marcar como visto" e conduta em cada alerta
- [x] Interfaces `SyncAdapter` e `EarthLink` (`src/sync/adapters.ts`) com a central e a ligação com a Terra simuladas (`src/sync/central.ts`). Sincronização automática a cada 5 s; a ligação com a Terra usa a conexão real do navegador
- [x] Pacote diário por tripulante (registro, alertas, anotações), vermelho na frente da fila, chegada com o atraso do ambiente
- [x] Tela "Visão do solo" com hora do dado, hora de chegada, atraso e aviso de que a decisão imediata é de bordo
- [x] Tela "Sincronização" só com o estado (sem botões de ligar ou desligar)
- [x] **Backend na Terra** (`server/`, Node 24 sem dependências: `node:http` + `node:sqlite`): guarda e devolve pacotes **cifrados**, nunca vê dado aberto; token por missão, CORS por origem, validação de formato. 8 testes (`cd server && npm test`) e job próprio no CI. No app, entra como `EarthLink` (`src/sync/httpEarthLink.ts`) quando `VITE_EARTH_API_URL` está definido; se o servidor cair, os pacotes esperam e saem sozinhos depois
- [ ] Publicar o backend no Railway com volume em `/data` (passo a passo em `server/README.md`) e configurar `VITE_EARTH_API_URL` e `VITE_EARTH_MISSION_TOKEN` no deploy do app
- [x] Revisão do código da fase 10 (revisor): corrigidos os 2 críticos e a maior parte dos importantes. Carga atrasada não grava mais dados de outra sessão no store; "visto" deixa de valer se o check-in for refeito ou o nível mudar; o médico do solo só abre pacotes entregues; pacote montado antes de marcar a fila como sincronizada; pacote congelado depois da primeira tentativa de envio; ciclos sem pedido perdido e com erro visível na tela; lotes de 100; trava entre abas; recriar a demonstração espera o ciclo; linhas ilegíveis são puladas; leitura no servidor com `READ_TOKEN` próprio; pausa de PIN por perfil; id aleatório no registro de acesso
- [x] Uma chave de dados por tripulante (cifrada no PIN do dono e no do oficial médico). Pacote do solo e resumo do comandante selados por chave pública na hora do check-in; a central só move caixas seladas. Conteúdo preso ao id (AAD). 10 testes em `src/data/isolation.test.ts` provam que um perfil não abre os dados dos outros nem lendo o banco direto
- [ ] Testes do store e da central com `fake-indexeddb` (bloqueio no meio do ciclo, fila, pacote já enviado). Hoje só as funções puras têm teste
- [ ] Prender o conteúdo cifrado ao registro (AES-GCM com `id` como dado adicional). Exige recriar a demonstração de novo. **Conferir:** a tarefa "uma chave de dados por tripulante", já marcada como feita, diz "Conteúdo preso ao id (AAD)"; se for o mesmo trabalho, marcar esta como feita
- [ ] Decidir quem pode mudar o **perfil e a fase da missão** (hoje qualquer tripulante muda o ambiente para todos). Com a M8, o ambiente passa a vir da fase da missão; sugestão: só o comandante e o oficial médico
- [ ] O perfil do médico do solo roda o ciclo de bordo, porque tudo está num navegador só. Num produto real o solo não teria a chave de bordo
- [ ] Buscar pacotes do servidor para recuperar dados num aparelho novo (a rota já existe; falta o app usar e resolver como a chave chega ao aparelho novo)
- [ ] Larissa: `scripts/verify-larissa.mjs` foi escrito antes do login por PIN e precisa entrar com um perfil (ex.: Lia, PIN 3333) antes de testar "Seus dados" e a mensagem. Também precisa percorrer os passos novos do check-in da fase 11 (estresse, carga, exercício em dois campos, medicação, teste de reação)
- [ ] Entregar as mensagens ao oficial médico pela central de bordo (hoje ficam só no aparelho do tripulante, cifradas). Fazer junto com a Larissa, que tem a mesma tarefa
- [ ] **(fase 11)** Levar o perfil de missão (M8) para o pacote do solo e para a "Visão do solo": nave, dia da missão de N e fase. O atraso mostrado passa a vir da fase
- [ ] **(fase 11)** Conferir se os valores novos (medicação, estresse, carga, treino resistido, teste de reação, origem do dado) chegam legíveis na "Visão do solo" e se o resumo do comandante continua sem nenhum dado clínico
- [x] `docs/arquitetura.md`, `docs/estrutura-do-projeto.md` e diagramas 01, 03, 05 e 06 (novo: sincronização) atualizados com papéis, central e backend
- [ ] 🔒 D3. Passar o mapa do corpo para 5 regiões: `REGIONS` e `rules.json`, e refazer as formas das figuras masculina **e** feminina em `bodyRegions.ts`
- [ ] 🔒 D3. Na figura: marcador só nas regiões amarelas e vermelhas, selo de "corpo inteiro" ao lado da figura em vez do contorno, área de toque maior na cabeça

### Talita: acessibilidade, layout e alarmes

Revisado em 15/11 considerando a fase 11 inteira (M1 a M11) como feita. Tarefas novas marcadas com **(fase 11)**.

- [x] Contraste em `src/styles/tokens.css`: `--text-faint` para `#8f9dba` e `--level-none` para `#8494b0`
- [x] Fontes de 11 px (barra inferior do celular e contadores) para no mínimo 12 px, de preferência 14 px (barra com 14 px; 12 px abaixo de 420 px de largura, para "Tendências" caber; contador com 12 px)
- [ ] Botão "Texto maior", que aumenta a escala base da fonte
- [ ] Testar com zoom de 200%, largura de 320 px e espaçamento de texto aumentado (WCAG 1.4.4, 1.4.10 e 1.4.12). Incluir as telas e seções da fase 11: passos novos do check-in, teste de reação, perfil de missão e metas semanais em Missão
- [ ] Layout no desktop: lista de regiões alinhada ao topo; chip "Estação" vira "Ambiente: Estação"
- [ ] Layout no celular: figura menor ou resumo antes dela ("1 região para acompanhar"); nome do tripulante sem corte (cargo na segunda linha); cabeçalho com fundo opaco
- [ ] Alarmes com Web Audio, sem arquivos de som: toque curto no amarelo, padrão repetido no vermelho até alguém confirmar
- [ ] Equivalente visual de todo som: banner fixo com cor, ícone e texto, contador na barra e vibração no celular
- [ ] Botão "Silenciar" no banner e volume por nível na tela de missão (WCAG 1.4.2). O vermelho pode ser silenciado, mas o banner só sai quando alguém confirma
- [x] Nada piscando mais de 3 vezes por segundo (WCAG 2.3.1). O único pulso, do vermelho no mapa, repete a cada 1,6 s; o banner novo precisa seguir a mesma regra
- [ ] Passada com leitor de tela e só teclado (fase 9), incluindo as telas da fase 11
- [ ] **(fase 11)** Teste de reação acessível: responder com toque, clique **ou** tecla (espaço); o passo pode ser pulado por quem não pode fazer um teste visual; o sinal aparece uma vez por tentativa, sem piscar mais de 3 vezes por segundo (WCAG 2.3.1)

### Lorena: idiomas, horários e escalonamento

Revisado em 14/11 depois das melhorias M1 e M2 e dos papéis do Davi, que já estão no código. Revisado em 15/11 considerando a fase 11 inteira (M1 a M11) como feita. Tarefas novas marcadas com **(fase 11)**.

- [ ] i18n com `react-i18next`: inglês como padrão e português como tradução, arquivos em `src/locales/en/` e `src/locales/pt-BR/` por área (comum, check-in, alertas, indicadores)
- [ ] Passar para chaves os textos de `src/content/indicators.ts`, das telas e os textos de alerta do `rules.json` (as faixas numéricas ficam no `rules.json`). Incluir os textos novos da fase 11: medicação, estresse, carga de trabalho, treino resistido, teste de reação, nomes e fases das missões, metas semanais, origem do dado e os avisos de perda óssea estimada, radiação acumulada e readaptação
- [ ] Datas e números com `Intl` (5.2 h em inglês, 5,2 h em português); a digitação continua aceitando vírgula e ponto
- [ ] Atualizar o `lang` do `<html>` ao trocar de idioma (WCAG 3.1.1) e um teste que falha se faltar chave em um dos idiomas

**Horários e lembretes.** O banner e o som são os mesmos dos alarmes da Talita: combinar uma função única (ex.: `raiseAlarm(level, text)`) para não existirem dois banners.

- [ ] Horário do check-in por tripulante na tela de missão, com lembrete antes, alerta de atraso e aviso ao oficial médico se o atraso passar do limite. Mostrar junto o dia da missão do perfil (M8), ex.: "Dia 45 de 180"
- [x] **(fase 11)** Lembrete do teste de reação (M4): na ISS ele era feito a cada 4 dias; acrescentar a opção "a cada 4 dias" à lista de lembretes. Feito junto com a M4
- [ ] **(fase 11)** Aviso de meta semanal atrasada (M9), ex.: "faltam 2 sessões de treino resistido nesta semana", no mesmo banner dos lembretes
- [ ] Lembrete recorrente "a cada X horas", com banner e som, usado primeiro para as **doses do plano de medicação** (M1; ex.: o colírio da Lia, 2 vezes ao dia) e também para outros casos, como hidratação. Os lembretes atuais "a cada N dias" continuam como opção
- [ ] Notificação do sistema quando a aba está em segundo plano e, ao abrir o app, conferir o que ficou atrasado. No iPhone só funciona com o app instalado na tela inicial e com permissão; na demonstração, o banner dentro do app é o que garante o aviso

**Escalonamento.** Os papéis já existem no código, então estas tarefas não estão mais bloqueadas.

- [ ] Escalonamento por nível: amarelo entra no resumo do oficial médico; amarelo por 3 dias vira pendência dele (vale também para **estresse e carga de trabalho**, da M2); **dose não tomada** (M1) entra no resumo do oficial médico no mesmo dia, sem esperar 3 dias; **reação mais lenta mantida por 3 dias** (M4) vira pendência dele, e sono curto junto com reação lenta (M7) entra no resumo; vermelho e sintoma vermelho avisam na hora e mostram "Chame o oficial médico agora"
- [ ] Texto do vermelho por ambiente, usando o `signalDelayLabel` de `ENVIRONMENTS` (`src/content/indicators.ts`) em vez de escrever o atraso à mão. Com a M8, o ambiente vem da **fase da missão**: o texto lê a fase atual do perfil. Na estação: "o solo será avisado no próximo contato". Em Marte, por exemplo: "a decisão é de bordo; o alerta leva de 3 a 22 minutos para chegar à Terra (só a ida)". O atraso é por sentido, não é tempo de resposta do médico (`docs/apresentacao.md`). O texto muda, o nível não (decisão 7)

**Predição.**

- [ ] 🔒 D4. Projeção linear na tela de tendências ("se continuar no ritmo dos últimos 7 dias, sai da faixa em cerca de N dias"), com confiança baixa e rótulo "projeção, não previsão". **Recomendação: decidir que não.** A apresentação diz "não anunciar projeção" e o recado central é "o app mede e compara, não prediz"; o tempo rende mais no escalonamento. A perda óssea estimada (M5) não é projeção: é a média publicada pela NASA multiplicada pelo tempo de missão, mostrada como contexto e não como previsão individual

### Larissa: pesquisa, LGPD e apresentação

Revisado em 15/11 considerando a fase 11 inteira (M1 a M11) como feita. Tarefas novas marcadas com **(fase 11)**.

- [x] Revisão **documental** das faixas, com referências e limites de evidência por nível em `rules.json` (`rangeEvidence`) e `docs/pesquisa/revisao-faixas.md`. Aprovação clínica da fase 2 continua pendente; nenhum corte numérico foi alterado
- [ ] **(fase 11)** Revisão documental, em `docs/pesquisa/revisao-faixas.md`, dos cortes novos escritos no `rangeEvidence`: medicação (amarelo se faltar dose, nunca vermelho), estresse e carga de trabalho (verde de 1 a 3, amarelo em 4 e 5), treino resistido (só desvio pessoal), teste de reação (M4), regra de fadiga (M7) e os números das metas semanais (M9). Conferir também o uso do 1% a 1,5% ao mês na M5: a NASA dá esse valor como média em missões de 4 a 6 meses
- [x] Nota educativa pelo sexo em Missão, com fonte NASA e orientação de readaptação à gravidade. Não muda faixas nem níveis; sem `sex`, usa texto geral
- [x] Texto e tela "Seus dados": finalidade, acesso real no protótipo, retenção, cópia JSON por perfil e pedido local de exclusão. O tripulante não exclui o próprio histórico (decisão da equipe em 14/11). Limites em `docs/privacidade.md`
- [ ] **(fase 11)** Privacidade dos dados novos em `docs/privacidade.md` e na tela "Seus dados": o plano de medicação é dado de saúde sensível e fica no cadastro do tripulante **sem cifra**; resultados do teste de reação; origem do dado. Conferir se a exportação JSON mostra os valores novos de forma legível
- [x] Aviso antes da primeira entrada: finalidade e limites da base legal (art. 11, II, f), sem presumir tutela da saúde ou consentimento genérico para o hackathon
- [x] Composição e histórico local de mensagem para **mostrar** ao oficial médico, com indicação de não enviada, validação, exportação e exclusão
- [ ] Entrega da mensagem ao oficial médico. Não está mais bloqueada: os papéis e a central de bordo do Davi já existem. Fazer junto com o Davi, que tem a mesma tarefa
- [x] Conteúdo no Git sobre como a NASA mede e onde o Sentinela entra (`docs/apresentacao.md`)
- [ ] **(fase 11)** Atualizar "De onde vêm os indicadores" em `docs/apresentacao.md`: acrescentar o teste de reação e **apagar a frase "o app não aplica o teste de reação"**, que deixa de ser verdade com a M4 (as duas partes já feitas junto com a M4: falta revisar o texto); acrescentar a origem do dado (M10)
- [ ] **(fase 11)** Reforçar "Como a NASA mede" com os aparelhos reais: dosímetro ativo e pulseira de actigrafia do Artemis II; esteira, bicicleta e aparelho resistido da ISS (cerca de 2 h por dia); flywheel compacto da Orion (cerca de 30 min por dia). Isso justifica o passo de exercício que vale para qualquer nave
- [ ] **(fase 11)** Texto dos recursos da NASA usados, exigido para o Prêmio Global (rascunho em inglês já preparado na conversa com a Talita)
- [x] Justificativa dos dados simulados, sem afirmar inexistência absoluta de conjuntos públicos (`docs/apresentacao.md`)
- [x] Comparação de ambientes e limites da evidência humana; atraso de Marte por sentido, não tempo de resposta médica (`docs/apresentacao.md`)
- [ ] **(fase 11)** Ligar "O que muda entre ambientes" ao perfil de missão (M8): missões de exemplo (ISS, Artemis II e Marte como referência, não missão real) e as fases
- [x] Limites de medição, comparação, predição e autenticação institucional futura (`docs/apresentacao.md`)
- [ ] **(fase 11)** Acrescentar em "O que podemos afirmar": perda óssea estimada e radiação acumulada são estimativa e contexto, não medidas nem limites; metas semanais não são prescrição
- [x] Roteiro da demonstração e respostas a perguntas (`docs/roteiro-demonstracao.md`); capturas das novas telas e teste de integração em `scripts/verify-larissa.mjs`
- [ ] **(fase 11)** Ensaiar o roteiro de novo, porque o check-in tem mais passos. Cenas sugeridas: perfil Artemis II em Missão; a Lia desmarcando o colírio (alerta "Dose não tomada", ligado ao caso de visão dela); o teste de reação em **modo curto** (os 3 minutos não cabem na demonstração). Refazer as capturas das telas que mudaram
- [ ] Slides e envio ao Space Apps. A equipe decidiu entregar **7 slides**: falta escolher quem faz e confirmar no guia do participante se o envio precisa estar em inglês

## Fase 11: melhorias alinhadas ao desafio oficial

O desafio pede um software que **reúna indicadores de saúde e permita ao astronauta avaliar e agir** sobre o próprio estado, citando imunidade, ossos, coração e saúde mental. As tarefas abaixo fecham lacunas desse pedido. Nenhuma é infraestrutura nova.

Valem as decisões de `CONTEXTO-IA.md`: faixas só em `rules.json`, o ambiente muda o texto e nunca o nível, correlação é "mudaram juntos" e estimativa nunca vira faixa de alerta.

### Reunir indicadores

- [x] **M1. Medicação**: indicador "tomei a medicação prevista", com lista por tripulante e lembrete. A página do evento de Kuala Lumpur cita medicação entre o que as agências monitoram, e a ISS usa o app Dose Tracker. Esforço baixo
- [x] **M2. Estresse e carga de trabalho**: duas escalas de 1 a 5 no check-in, na região "Mente e sono". São as perguntas do Reaction Self Test da NASA. Esforço baixo
- [x] **M3. Tipo de exercício**: separar aeróbico de resistido (musculação). O resistido é o que protege o osso, e o alerta já recomenda priorizá-lo. Esforço baixo
- [x] **M4. Teste de reação de 3 minutos**: tocar a tela assim que o sinal aparece, como no Reaction Self Test (ISS, desde 2009). Entra como indicador com linha de base pessoal. Incluir um **modo curto** para a demonstração (cerca de 30 s) e o lembrete "a cada 4 dias", como na ISS. Esforço médio; é o maior ganho em saúde mental

### Avaliar

- [x] **M5. Perda óssea estimada pelo dia de missão** (média de 1% a 1,5% ao mês), mostrada como "estimativa, não medida". Só contexto, sem faixa de alerta. Esforço baixo
- [x] **M6. Radiação acumulada na missão**: soma das doses do dia, como contexto, sem faixa nova. Esforço baixo
- [x] **M7. Fadiga**: sono de 6 h ou menos junto com reação mais lenta aparece como "mudaram juntos", sem afirmar causa. Base: estudo com 24 astronautas em missões de 6 meses na ISS. Esforço baixo; depende de M4
- [x] **M8. Perfil de missão**: nave, tamanho da tripulação, duração e fases (ida, superfície, volta), com modelos ISS (cerca de 6 meses), Artemis II (Orion, 4 pessoas, cerca de 10 dias) e Marte (marcado como referência, não missão real). A tela de missão mostra "Dia 45 de 180, fase trânsito", e a fase define o ambiente. Quem pode mudar o perfil e a fase fica na tarefa do Davi. Esforço médio

### Agir

- [x] **M9. Metas semanais de sono e exercício**: a gamificação leve sugerida no enunciado, prometida na proposta e ainda ausente. Esforço baixo
- [ ] **M10. Origem do dado**: cada valor marcado como "digitado", "pulseira" ou "dosímetro", e textos "como medir" citando os aparelhos do Artemis II (pulseira do ARCHeR e Crew Active Dosimeter). Opcional: importar um arquivo de exemplo da pulseira. Esforço baixo
- [ ] **M11. Readaptação à gravidade**: perto do fim da missão ou do pouso, destacar a orientação de tontura ao levantar que já existe em Missão (entrega da Larissa). Depende de M8. Esforço baixo

### Ordem sugerida

1. M1, M2 e M3: rápidas e fecham as lacunas do tema.
2. M8: base para M5, M6 e M11.
3. M5, M6 e M9.
4. M4 e depois M7: maior impacto na demonstração.
5. M10 e M11.

### Prioridade das tarefas que já existem

- **No tema, manter:** alarmes e banner (Talita), escalonamento e texto do vermelho por ambiente (Lorena), horário do check-in e lembretes (Lorena), revisão das faixas, acessibilidade, teste offline e publicação.
- **Fora do tema, congelar até a entrega** (não apagar): backend no Railway e variáveis de deploy, recuperar dados em aparelho novo, prender o conteúdo cifrado ao registro, solo sem a chave de bordo, testes do store e da central. O i18n completo só se os jurados avaliarem em inglês; nesse caso, ao menos as telas principais.

## Limitações conhecidas

- A lista de medicação prevista fica no registro do tripulante, que não é cifrado (como a lista de indicadores acompanhados). Só os registros diários, com as doses tomadas, são cifrados. Num produto real, o plano de medicação também seria cifrado.
- A lista de medicação prevista não é editável pela interface: vem da demonstração.
- Os dados ficam no navegador onde o app foi aberto. Outro navegador começa com outra demonstração e outra chave de dados, então não consegue abrir os pacotes do primeiro.
- A central de bordo é simulada no próprio navegador: todos os perfis usam o mesmo aparelho.
- O PIN de 4 a 6 números protege pouco contra quem copiar o banco do aparelho (dá para testar todas as combinações fora do app). Num produto real a chave ficaria no hardware do aparelho ou no sistema da agência.
- O token do backend vai junto do app publicado; só impede gravações de quem não tem o app.
- O app envia pacotes ao backend, mas ainda não busca de volta para recuperar dados num aparelho novo.
- Os lembretes aparecem na tela de missão; não há notificação do sistema.
