# Tarefas da revisão com as fontes da NASA (15/11/2026)

Cada tarefa veio de uma comparação entre o que o Sentinela faz hoje e o que a NASA faz de verdade, com a fonte citada. Não repete o que já está no `TASKS.md`: leitura automática de aparelhos, alarmes sonoros, escalonamento, acessibilidade e i18n continuam lá.

Os identificadores N1 a N21 não conflitam com os M1 a M11 da fase 11. O modelo de dados citado está detalhado em [especificacao-de-dados.md](especificacao-de-dados.md).

Toda faixa nova entra como demonstração, com `demo: true` e `rangeEvidence`, e precisa da mesma revisão documental que a Larissa fez nas faixas atuais.

## Resumo

| # | Tarefa | Prioridade | Esforço | Área |
| --- | --- | --- | --- | --- |
| N0 | Resolver o merge em andamento | Bloqueia tudo | Médio | Qualquer |
| N1 | Temperatura com linha de base | Alta | Pequeno | Motor |
| N2 | Radiação acumulada contra 600 mSv | Alta | Médio | Motor |
| N3 | Corrigir o texto da visão | Alta | Mínimo | Pesquisa |
| N4 | Evidência da pressão em voo | Alta | Mínimo | Pesquisa |
| N5 | Evidência do corte de 6 horas de sono | Alta | Mínimo | Pesquisa |
| N6 | Evidência dos sintomas com percentuais | Média | Mínimo | Pesquisa |
| N7 | Dois sintomas novos | Média | Pequeno | Motor |
| N8 | Glicemia fora da rotina da NASA | Alta | Pequeno | Pesquisa |
| N9 | Comandante sem vermelho de saúde mental | Alta | Pequeno | Papéis |
| N10 | Atualizar a revisão das faixas | Alta | Pequeno | Pesquisa |
| N11 | Massa corporal | Média | Médio | Motor |
| N12 | Alimentação e água | Média | Pequeno | Motor |
| N13 | CO2 da cabine | Média | Médio | Motor |
| N14 | Qualidade do sono | Média | Pequeno | Motor |
| N15 | Visão com grade de Amsler | Média | Grande | Interface |
| N16 | Exercício por sessão | Média | Médio | Motor |
| N17 | Condicionamento periódico | Baixa | Médio | Motor |
| N18 | Cadência por indicador | Média | Grande | Motor |
| N19 | Bloco mensal de sono e equipe | Baixa | Médio | Interface |
| N20 | Caution e Warning na tradução | Baixa | Pequeno | Idiomas |
| N21 | Atualizar "Como a NASA mede" | Média | Pequeno | Apresentação |

## Fase 0: desbloquear

### N0. Resolver o merge em andamento

- [ ] **N0.** O repositório está com um merge pela metade e 11 arquivos com conflito não resolvido: `src/rules/rules.json`, `src/content/indicators.ts`, `src/content/privacy.ts`, `src/components/checkin/ReactionTestStep.tsx`, `src/components/checkin/SourcePicker.tsx`, `src/lib/boneEstimate.ts`, `src/lib/radiationTotal.ts`, `src/pages/CheckinPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/MedicalContactPage.tsx` e `src/pages/YourDataPage.tsx`. Os marcadores `<<<<<<< HEAD` continuam dentro dos arquivos e o app não compila assim.
  - Um lado usa chaves de tradução (`alerts:rules.reactionTime.whyItMatters`), o outro tem o texto em português direto. Manter o lado das chaves.
  - **Aceite:** `npm run build` e `npm test` passam, e `grep -rn '<<<<<<<' src/` não devolve nada.

Nada abaixo deve ser aplicado antes disso.

## Fase 1: correções no que já existe

Nenhuma muda o formato dos dados, então não precisam de versão nova do banco.

### N1. Temperatura com linha de base

- [ ] **N1.** Em `rules.json`, trocar `"useBaseline": false` por `true` na temperatura, com `"deviationDirection": "above"`.
  - **Por quê:** um estudo com 11 astronautas encontrou a temperatura central em repouso cerca de 1 °C mais alta, subindo aos poucos ao longo de 2,5 meses ([Stahn et al., 2017](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5701078/)). Com faixa fixa da Terra, um tripulante saudável no terceiro mês ficaria amarelo todos os dias.
  - **Cuidado:** o estudo mediu temperatura central com sensor na testa, não com termômetro comum. Isso vai no `rangeEvidence`, não vira faixa nova.
  - **Arquivos:** `src/rules/rules.json`, `src/rules/engine.test.ts`.
  - **Aceite:** um caso de teste com 7 dias em 36,6 °C seguidos de 3 dias em 37,0 °C gera amarelo por desvio; um caso com subida lenta ao longo de 60 dias não gera alerta todo dia.

### N2. Radiação acumulada contra o limite de carreira

- [ ] **N2.** Somar a dose da missão e mostrar em mSv, como percentual dos 600 mSv de carreira. Campo opcional no tripulante para a dose de missões anteriores (`priorCareerDoseMsv`).
  - **Por quê:** o limite da NASA é 600 mSv na carreira, igual para todas as idades e sexos, e 250 mSv por evento solar ([OCHMO](https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf)). Hoje o `radiationTotal` (M6) soma as doses do dia e só mostra como contexto.
  - **Não fazer:** gerar alerta pelo acumulado. É contexto, e o cálculo oficial da NASA é de dose efetiva, mais complexo do que somar leituras de dosímetro.
  - **Arquivos:** `src/lib/radiationTotal.ts`, `src/types/index.ts`, `src/components/body/RegionPanel.tsx`, `src/pages/TrendsPage.tsx`.
  - **Aceite:** a tela mostra algo como "48 mSv acumulados nesta missão, 8% do limite de carreira de 600 mSv", com a fonte e a palavra "estimativa".

### N3. Corrigir o texto da visão

- [ ] **N3.** O app diz que cerca de 70% dos astronautas "têm inchaço no fundo do olho". Trocar por: cerca de 70% mostram sinais iniciais no exame de tomografia; 16% chegam a ter inchaço do nervo óptico.
  - **Por quê:** 16% é o número da NASA para edema do disco óptico ([OCHMO](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf)). Os 70% das nossas fontes são sinais iniciais na tomografia, que é outra coisa.
  - **Arquivos:** `src/content/indicators.ts`, `src/rules/rules.json`, traduções, `docs/apresentacao.md`.

### N4. Evidência da pressão arterial em voo

- [ ] **N4.** Acrescentar ao `rangeEvidence` e ao `whyItMatters` da pressão: em 24 horas de medição no espaço, a sistólica ficou 8 mmHg e a diastólica 9 mmHg abaixo do valor em solo, com frequência cardíaca igual ([Norsk et al., 2015](https://pmc.ncbi.nlm.nih.gov/articles/4324706/)). Foram 8 astronautas, todos homens.
  - **Não fazer:** mudar a faixa. O estudo é pequeno e de um só sexo.

### N5. Evidência do corte de 6 horas de sono

- [ ] **N5.** Acrescentar ao `rangeEvidence` do sono: em 24 astronautas, dormir 6 horas ou menos esteve ligado a reação mais lenta e mais estresse ([Jones et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197)).
  - É a única faixa do app com apoio direto em dado de astronauta. Vale citar na apresentação.

### N6. Evidência dos sintomas com percentuais

- [ ] **N6.** Acrescentar ao `rangeEvidence` dos sintomas: síndrome de adaptação em 50% a 70% da tripulação, congestão em mais de 50%, dor nas costas em 52% ([OCHMO](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf)). Cerca de 71% usa remédio para dormir.

### N7. Dois sintomas novos

- [ ] **N7.** Acrescentar `jointMusclePain` (dor muscular ou nas articulações) e `urinaryRetention` (dificuldade para urinar), os dois amarelos.
  - **Por quê:** os dois constam da lista de condições em voo da NASA e faltam na nossa.
  - **Arquivos:** `src/rules/rules.json`, traduções dos dois idiomas.
  - **Aceite:** o teste que compara as chaves dos dois idiomas continua passando.

### N8. Glicemia: dizer que está fora da rotina da NASA

- [ ] **N8.** Acrescentar ao texto da glicemia: não é rotina da NASA em voo; está no app porque o desafio cita açúcar no sangue. Tirar a ligação da glicemia com o risco de nutrição, que passa para massa corporal e alimentação (N11 e N12).
  - **Por quê:** não encontramos monitoramento rotineiro de glicemia em voo. O primeiro monitoramento contínuo na estação foi em 2025, num estudo privado ([Axiom](https://www.collectspace.com/ubb/Forum38/HTML/002658.html)). A NASA faz exame de sangue no dia 30 de voo e 30 dias antes do retorno.

### N9. Comandante sem vermelho de saúde mental

- [ ] **N9.** O resumo que o comandante vê não deve considerar alertas vindos de humor, estresse, carga de trabalho nem medicação.
  - **Por quê:** a NASA trata a informação psicológica como comunicação privada, igual à médica ([NASA-STD-3001](https://www.nasa.gov/reference/6-0-medical-operations/)). Hoje um vermelho de humor aparece como vermelho no painel do comandante, e o contexto deixa adivinhar a causa.
  - **Arquivos:** `src/lib/access.ts`, `src/sync/compose.ts`, `src/lib/lib.test.ts`.
  - **Aceite:** um teste em que o único alerta vermelho vem do humor e o resumo do comandante sai com `red: false`.

### N10. Atualizar a revisão das faixas

- [ ] **N10.** Registrar em `docs/pesquisa/revisao-faixas.md` tudo que mudou em N1 a N8, com as fontes novas.

## Fase 2: dados novos simples

As quatro exigem versão nova do banco (v12) e recriar a demonstração. Fazer juntas, numa migração só.

### N11. Massa corporal

- [ ] **N11.** Indicador periódico em kg, comparado com o valor inicial da missão (`startBodyMassKg` no tripulante).
  - **Por quê:** é o indicador real de nutrição em voo. Em 25 tripulantes, a perda média foi de 2,8% a 4,4% em relação ao pré-voo, concentrada nos primeiros 30 dias, e a ingestão fica em cerca de 80% da necessidade ([Zwart et al., 2014](https://www.ncbi.nlm.nih.gov/pubmed/25197887)).
  - **Proposta de demonstração:** amarelo acima de 5% de perda, vermelho acima de 10%. Região: corpo inteiro. Risco: alimentação e nutrição inadequadas.
  - **Aceite:** o alerta cita o percentual perdido e o valor inicial, não só o peso de hoje.

### N12. Alimentação e água

- [ ] **N12.** Passo diário simples: refeições completas feitas (0 a 3 ou mais) e água suficiente (sim ou não). Sem contagem de calorias.
  - **Por quê:** os astronautas registram o que comem num aplicativo de tablet desde 2016 ([NASA](https://www.nasa.gov/?p=209742)). No aplicativo europeu, basta fotografar o código de barras.
  - **Aceite:** dois dias seguidos sem refeição completa entram no resumo do oficial médico.

### N13. CO2 da cabine

- [ ] **N13.** Dado da missão, não da pessoa, em mmHg, informado na tela de Missão. Acima de 3 mmHg, aviso geral. Quando alguém marcar dor de cabeça ou nariz entupido, a orientação inclui conferir o CO2 da cabine.
  - **Por quê:** a norma limita a média de 1 hora a 3 mmHg, justamente para conter dores de cabeça ([OCHMO](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf)). Tripulantes relataram sintomas a partir de 2,3 mmHg, e os médicos perguntam sobre isso nas conferências semanais ([NASA](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20150019624.pdf)).
  - **Arquivos:** `src/types/index.ts` (`Settings`), `src/pages/MissionPage.tsx`, `src/rules/engine.ts`.
  - **Aceite:** o alerta de dor de cabeça muda de texto quando o CO2 está acima de 3 mmHg.

### N14. Qualidade do sono

- [ ] **N14.** Escala ao lado das horas de sono.
  - **Por quê:** a NASA compara o sono relatado com o medido pela pulseira, e a qualidade é parte do questionário ([Standard Measures](https://ntrs.nasa.gov/api/citations/20200001281/downloads/20200001281.pdf)).
  - Sete horas com remédio não são sete horas sem: cruzar com a medicação (M1) no gráfico.

## Fase 3: mudança de método

Mexem em como se mede, não só no que se guarda. Precisam de decisão da equipe antes.

### N15. Visão com grade de Amsler

- [ ] **N15.** Trocar a nota de 0 a 2 por uma grade de Amsler na tela, um olho de cada vez, com três perguntas: linhas tortas, áreas faltando, piora na leitura de perto. Cadência nos dias 30, 90, 180 e 270 de missão e 30 antes do retorno.
  - **Por quê:** a bordo se faz acuidade de longe no laptop, cartão de perto na mão e grade de Amsler no laptop ([NASA](https://ntrs.nasa.gov/api/citations/20170009173/downloads/20170009173.pdf)), nesse calendário ([OCHMO](https://www.nasa.gov/wp-content/uploads/2023/03/longitudinal-health-surveillance-technical-brief-ochmo.pdf)).
  - **Acessibilidade:** é um teste visual. Precisa poder ser pulado, como já foi feito no teste de reação (M4).
  - **Aceite:** o autoteste diz que não diagnostica SANS e indica quando pedir exame.

### N16. Exercício por sessão

- [ ] **N16.** Três campos: tipo de sessão (aeróbico, resistido ou os dois); minutos e frequência cardíaca média do aeróbico; sessão resistida feita, parcial ou não feita. Comparar o volume da semana com o plano e com a linha de base, em vez de faixa fixa de minutos.
  - **Por quê:** a NASA registra cada sessão por aparelho, com frequência cardíaca, velocidade e carga ([NASA](https://ntrs.nasa.gov/api/citations/20160012791/downloads/20160012791.pdf)). Dados reais: sessões de 26 a 27 minutos, frequência média de 131 a 135 bpm, cerca de 600 minutos por semana ([Scott et al., 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9898566)).
  - A revisão da Larissa já avisa que duração sozinha não diz nada sobre intensidade.

### N17. Condicionamento periódico

- [ ] **N17.** Indicador periódico: resultado da avaliação de condicionamento, em percentual do valor de antes do voo. Abaixo de 80% gera alerta.
  - **Por quê:** a norma exige manter em voo pelo menos 80% da capacidade aeróbica e 80% da força de antes da missão ([OCHMO](https://www.nasa.gov/?p=808462)).
  - Seria a primeira faixa do app que não é de demonstração: o número vem da norma. Marcar isso com destaque no `rangeEvidence`.
  - **Em aberto:** não encontramos a frequência dessa avaliação em voo. Chamar de periódica, não mensal.

### N18. Cadência por indicador

- [ ] **N18.** Cada indicador ganha uma frequência: diário, semanal, mensal ou por dia de missão. O check-in diário pergunta só o que é diário.
  - **Por quê:** a NASA não mede tudo todo dia, e o tempo de tripulação é recurso contado ([análise de tempo médico](https://ntrs.nasa.gov/api/citations/20230015627/downloads/Med%20Crew%20Time%20Analysis.pdf)).
  - **Proposta:** diário o sono, as escalas, os sintomas, o exercício, a alimentação e a medicação; semanal a pressão, a frequência, a temperatura e a massa; mensal o bloco de equipe e o condicionamento; por dia de missão a visão.
  - O oficial médico pode aumentar a frequência de qualquer item para um tripulante, aproveitando os lembretes "a cada N dias" que já existem.
  - **Aceite:** o check-in diário cabe em 2 a 3 minutos.

### N19. Bloco mensal de sono e equipe

- [ ] **N19.** Uma vez por mês, perguntas sobre qualidade do sono e convivência com a equipe.
  - **Por quê:** é a frequência e o conteúdo do questionário da NASA, preenchido antes e depois de dormir ([Standard Measures](https://ntrs.nasa.gov/api/citations/20180002943/downloads/20180002943.pdf)).
  - **Privacidade:** as respostas falam de colegas. Ficam visíveis só para o próprio tripulante e para o oficial médico, e nunca por pessoa para o resto da tripulação.
  - **Não fazer:** copiar questionários validados como o POMS, que têm direitos autorais e só valem aplicados inteiros. As perguntas são nossas, marcadas como demonstração.

## Fase 4: alinhamento e apresentação

### N20. Caution e Warning na tradução

- [ ] **N20.** Na versão em inglês, amarelo vira Caution e vermelho vira Warning.
  - **Por quê:** é o padrão da NASA: Warning pede ação imediata, Caution pede atenção sem ação imediata, Advisory é informativo ([NASA](https://ntrs.nasa.gov/api/citations/20240003565/downloads/CLD%20HSI%20Workshop%20Alerts.pdf)).
  - **Não usar** Emergency, reservado a fogo, perda de pressão e atmosfera tóxica.
  - Vale junto com a tarefa de alarmes da Talita: tripulantes da estação pediram voz e luz junto do tom, porque os tons são difíceis de distinguir nos primeiros segundos.

### N21. Atualizar "Como a NASA mede"

- [ ] **N21.** Em `docs/apresentacao.md`, acrescentar o que a pesquisa de 15/11 trouxe: conferência médica privada semanal e psicológica a cada duas semanas; bateria Cognition de 10 testes nos dias 30 e antes do retorno; calendário do exame de visão; dosímetro individual; registro de alimentação em tablet; massa corporal em voo.
  - Acrescentar também o que a NASA não faz: não mede densidade óssea em voo, não faz glicemia de rotina, e em 25 astronautas de missões de 6 meses não houve queda sistemática do desempenho cognitivo ([NASA BHP](https://www.kbr.com/document/16756)).

## O que decidimos não mudar

| Ponto | Decisão |
| --- | --- |
| Faixa de pressão e de frequência cardíaca | fica como está; os estudos em voo são pequenos e de um só sexo |
| Sexo do tripulante | continua sem efeito em faixa, linha de base ou nível |
| Projeção de tendência | continua fora (decisão D4 do `TASKS.md`) |
| Alerta pelo acumulado de radiação | não; é contexto, o cálculo oficial é mais complexo |
| Questionários psicológicos validados | não copiar; usar perguntas próprias marcadas como demonstração |

## Pontos sem fonte ou com fontes divergentes

Falar assim na apresentação, em vez de dar um número:

| Ponto | Situação |
| --- | --- |
| Glicemia em voo | sem rotina da NASA encontrada |
| Frequência de pressão e temperatura | a NASA não define; a nossa é escolha do protótipo |
| Avaliação cognitiva | um documento diz a cada 30 dias, outro diz duas vezes por missão |
| Massa corporal | semanal numa descrição, quinzenal em outra |
| Avaliação de condicionamento | existe em voo; frequência não encontrada |
| Bio-Monitor | usado em pesquisa; rotina clínica não confirmada |

## Perguntas para a equipe

1. Aprovam os quatro dados novos da fase 2 (massa, alimentação, CO2, qualidade do sono)?
2. A cadência proposta em N18 serve, ou mantemos tudo diário na demonstração?
3. N15 (grade de Amsler) e N16 (exercício por sessão) entram no hackathon ou ficam como trabalho futuro?
4. Quem revisa os limites marcados como proposta: massa corporal, cadência semanal e as perguntas do bloco mensal?
