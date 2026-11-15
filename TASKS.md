# Tarefas do Sentinela

O que falta fazer, dividido por pessoa, e o histórico do que já foi feito. Atualizado em 2026-11-15.

As tarefas **N0 a N21** vêm da revisão com as fontes da NASA de 15/11. O detalhe de cada uma (motivo, fonte, arquivos e aceite) está em [`docs/tarefas-nasa-2026-11-15.md`](docs/tarefas-nasa-2026-11-15.md); o modelo de dados está em [`docs/especificacao-de-dados.md`](docs/especificacao-de-dados.md).

A divisão é uma sugestão: troquem entre vocês se preferirem, só atualizem o nome aqui. Marquem `[x]` ao terminar.

## Estado

| Fase | Assunto | Estado |
| --- | --- | --- |
| 0 a 7 | Pesquisa, estrutura, motor de regras, dados, check-in, painel, alertas, tendências | Feito |
| 8 | PWA e publicação | Falta só publicar (build sem rede testado em 15/11) |
| 9 | Entrega do hackathon | A fazer |
| 10 | Pontos da reunião da equipe (14/11) | Em andamento |
| 11 | Melhorias alinhadas ao desafio oficial (M1 a M11) | Feito |
| 12 | Revisão com as fontes da NASA (N0 a N21) | Quase feito: faltam N10 (fechamento), N18 e N19 |

## Regras que valem para tudo

- Valem as decisões de `CONTEXTO-IA.md`: faixas só em `rules.json`, o ambiente muda o texto e nunca o nível, correlação é "mudaram juntos" e estimativa nunca vira faixa de alerta.
- Todo texto novo entra como chave de tradução, em inglês e português.
- Toda faixa nova entra como demonstração, com `demo: true` e `rangeEvidence`, e passa pela revisão documental da Larissa.
- As tarefas N11 a N14 exigem versão nova do banco (v12) e recriar a demonstração: fazer numa migração só.

## Decisões da equipe (todos)

Até a equipe decidir, as tarefas marcadas com 🔒 ficam paradas.

- [x] **D3. Regiões do corpo:** decidido em 15/11: **ficam as 7 regiões**. A troca para 5 chegou a ser feita e foi desfeita porque a equipe quer o painel como era.
- [x] **D4. Predição:** decidido em 15/11: **o app só mede e compara**, sem projeção, como já dizem `docs/apresentacao.md` e "O que decidimos não mudar" em `docs/tarefas-nasa-2026-11-15.md`.
- [x] **D5. Dados novos da fase 12:** decidido em 15/11: **aprovados** massa corporal, alimentação e água, CO2 da cabine e qualidade do sono (N11 a N14). Já estão implementados, com especificação e privacidade v7 revisadas pela Larissa.
- [x] **D6. Cadência:** decidido em 15/11: **tudo continua diário na demonstração**. A cadência da N18 é proposta para depois do hackathon e entra na apresentação como próximo passo; mudar o fluxo do check-in no dia da entrega quebraria o roteiro. N18 e N19 viram trabalho futuro.
- [x] **D7. Mudança de método:** grade de Amsler (N15) e exercício por sessão (N16) entram no hackathon como protótipos demonstrativos; a cadência detalhada segue N18.
- [x] **D8. Revisão das propostas:** decidido em 15/11: a **Larissa** faz a revisão documental (massa corporal, cadência e perguntas do bloco mensal), como já faz com as faixas. A revisão clínica continua pendente e fora do alcance da equipe.
- [ ] **Revisão das faixas** (vem da fase 2): as faixas verdes de pressão, frequência, glicemia, temperatura e sono vêm de `docs/pesquisa/`. Estas foram escolhidas para a demonstração e precisam de confirmação:
  - todas as faixas amarelas;
  - a faixa verde de pressão por número (sistólica de 100 a 130 e diastólica de 60 a 85; a pesquisa só diz "perto de 120/80");
  - exercício (verde de 60 a 150 min; a pesquisa cita cerca de 90 min por dia, mas diz que não é meta universal);
  - humor (4 e 5 são verdes, 3 é amarelo);
  - visão (1 é amarelo, 2 é vermelho);
  - o nível de cada sintoma (dor no peito e falta de ar são vermelhos; os outros, amarelos).

## Ordem sugerida

1. Itens de prioridade alta da fase 12, que não mudam o banco: N9 (Davi), N1 (Davi), N8 e N3 a N5 (Lorena).
2. Alarmes e banner (Talita) junto com escalonamento e lembretes (Lorena), usando uma função única (ex.: `raiseAlarm(level, text)`) para não existirem dois banners.
3. Depois de D5: migração v12 (Davi) com N11 e N13, e logo em seguida N12 e N14 (Talita).
4. Depois de D6 e D7: fase 3 da revisão (N15 a N19).
5. Por último: publicação, apresentação, roteiro e slides.

**Congelado até a entrega** (não apagar): marcado com ❄️ nas listas abaixo. São tarefas fora do tema do desafio.

## Davi: papéis, segurança, motor e publicação

**Fase 12 (novas)**

- [x] **N0.** Resolver o merge em andamento. Conferido em 15/11: nenhum marcador de conflito em `src/` e repositório sem mudanças pendentes
- [x] **N9.** Comandante sem vermelho de saúde mental: o resumo do comandante não considera alertas de humor, estresse, carga de trabalho nem medicação. Prioridade alta, esforço pequeno
- [x] **N1.** Temperatura com linha de base (`useBaseline: true`, desvio para cima). Prioridade alta, esforço pequeno
- [x] **N2.** Radiação acumulada em mSv como percentual dos 600 mSv de carreira, com `priorCareerDoseMsv` opcional. Contexto, sem alerta. Esforço médio
- [x] **Migração v12** do banco, uma só, com os campos de N11 a N14, e recriar a demonstração. Depende de D5
- [x] **N11.** Massa corporal comparada com `startBodyMassKg`; demonstração com amarelo acima de 5% de perda e vermelho acima de 10%. Depende de D5. Esforço médio
- [x] **N13.** CO2 da cabine em mmHg na tela de Missão; acima de 3 mmHg, aviso geral e orientação no alerta de dor de cabeça. Depende de D5. Esforço médio
- [x] ~~**N17.** Condicionamento periódico~~: **retirado em 15/11**, porque não há como medir essa avaliação a bordo. A migração v15 tira o indicador dos cadastros; os nomes dos aparelhos ficaram no passo de exercício

**Fase 10 e 11**

- [x] Quem muda o **perfil, a fase, o ambiente e o CO2 da missão**: só o comandante e o oficial médico (`canEditMission` em `src/lib/access.ts`, conferido no store e na tela). Os outros veem os campos travados, com aviso
- [x] Perfil de missão (M8) no pacote do solo (`payload.mission`) e na "Visão do solo": "Missão: … · dia 60 de 180 · fase: …". O atraso já vem do ambiente, que segue a fase quando há perfil
- [x] Valores novos legíveis na "Visão do solo", conferido no navegador em 15/11. Acrescentados a qualidade do sono, o tipo e os aparelhos do exercício e a origem do dado ("sensor vestível", "dosímetro pessoal"). O resumo do comandante continua sem dado clínico (teste da N9)
- [ ] Entregar as mensagens ao oficial médico pela central de bordo (hoje ficam só no aparelho do tripulante, cifradas). Fazer junto com a Larissa
- [x] ~~D3. Mapa do corpo com 5 regiões e mudanças na figura~~: não fazer (D3 decidida: ficam as 7 regiões)
- [x] Backend publicado no Railway em 15/11: projeto `sentinela-server`, volume em `/data`, https://sentinela-server-production.up.railway.app. `ALLOWED_ORIGINS` é o app publicado; o `READ_TOKEN` fica só nas variáveis do Railway. Testado de ponta a ponta: o check-in feito no app publicado chega cifrado ao servidor
- [ ] ❄️ Testes do store e da central com `fake-indexeddb` (bloqueio no meio do ciclo, fila, pacote já enviado). Hoje só as funções puras têm teste
- [ ] ❄️ O perfil do médico do solo roda o ciclo de bordo, porque tudo está num navegador só. Num produto real o solo não teria a chave de bordo
- [ ] ❄️ Buscar pacotes do servidor para recuperar dados num aparelho novo (a rota já existe; falta o app usar e resolver como a chave chega ao aparelho novo)

**Publicação (fase 8)**

- [x] Uso sem rede no build de produção, conferido em 15/11: com o service worker ativo e a rede cortada, o app abre, a Lia entra, faz e salva o check-in, sem erro no console
- [x] App publicado na Vercel (projeto `sentinela`, ligado ao GitHub; publica sozinho a cada push no `main`): https://sentinela-theta-nine.vercel.app. Em produção, `VITE_EARTH_API_URL` e `VITE_EARTH_MISSION_TOKEN` ligam o app ao backend; as prévias de branch usam a ligação simulada
- [x] `npm audit` revisto em 15/11: 8 avisos (2 baixos, 6 moderados). Seis são do build do PWA (`workbox-build`, `glob`, `minimatch`), que não vai para o app publicado. Os 2 do `react-router` 6 não se aplicam: todo destino de `Link`/`navigate` é fixo no código e o app não usa SSR. A correção exige versão maior (`react-router-dom` 7, `vite-plugin-pwa` 1.1); fica para depois da entrega
- [x] Licença: MIT, em nome da Equipe CosmoTI (`LICENSE`, `package.json` e `README.md`)

## Lorena: idiomas, textos, horários e escalonamento

**Fase 12 (novas)**

- [x] **N8.** Glicemia: dizer que não é rotina da NASA em voo e que está no app porque o desafio cita açúcar no sangue; tirar a ligação com o risco de nutrição. Prioridade alta, esforço pequeno
- [x] **N3.** Corrigir o texto da visão: cerca de 70% mostram sinais iniciais na tomografia; 16% chegam a ter inchaço do nervo óptico. Em `indicators.ts`, `rules.json`, traduções e `docs/apresentacao.md`. Prioridade alta
- [x] **N4.** Evidência da pressão em voo no `rangeEvidence` e no `whyItMatters` (Norsk et al., 2015), sem mudar a faixa. Prioridade alta
- [x] **N5.** Evidência do corte de 6 horas de sono no `rangeEvidence` (Jones et al., 2022). Prioridade alta
- [x] **N6.** Evidência dos sintomas com percentuais no `rangeEvidence` (OCHMO)
- [x] **N7.** Dois sintomas novos, amarelos: `jointMusclePain` e `urinaryRetention`, nos dois idiomas. Feito em 15/11; a Larissa pode fechar a N10
- [ ] **N10.** Registrar em `docs/pesquisa/revisao-faixas.md` tudo que mudou em N1 a N8, com as fontes novas. Revisão documental com a Larissa
- [x] **N20.** Na versão em inglês, amarelo é Caution e vermelho é Warning (nunca Emergency) no banner, nos selos, nas contagens e no resumo das regiões. Feito em 15/11. O banner amarelo rola com a página e só o vermelho fica preso no topo
- [ ] ❄️ **N18.** Cadência por indicador (diário, semanal, mensal ou por dia de missão); o check-in diário pergunta só o que é diário e cabe em 2 a 3 minutos. D6 decidiu manter tudo diário na demonstração: fica para depois da entrega. Esforço grande

**Horários e lembretes.** O banner e o som são os mesmos dos alarmes da Talita.

- [ ] Horário do check-in por tripulante na tela de missão, com lembrete antes, alerta de atraso e aviso ao oficial médico se o atraso passar do limite. Mostrar junto o dia da missão do perfil (M8), ex.: "Dia 45 de 180"
- [ ] Aviso de meta semanal atrasada (M9), ex.: "faltam 2 sessões de treino resistido nesta semana", no mesmo banner dos lembretes
- [ ] Lembrete recorrente "a cada X horas", com banner e som, usado primeiro para as **doses do plano de medicação** (M1; ex.: o colírio da Lia, 2 vezes ao dia) e também para outros casos, como hidratação. Os lembretes atuais "a cada N dias" continuam como opção
- [ ] Notificação do sistema quando a aba está em segundo plano e, ao abrir o app, conferir o que ficou atrasado. No iPhone só funciona com o app instalado na tela inicial e com permissão; na demonstração, o banner dentro do app é o que garante o aviso

**Escalonamento.**

- [ ] Escalonamento por nível: amarelo entra no resumo do oficial médico; amarelo por 3 dias vira pendência dele (vale também para **estresse e carga de trabalho**, da M2); **dose não tomada** (M1) entra no resumo do oficial médico no mesmo dia, sem esperar 3 dias; **reação mais lenta mantida por 3 dias** (M4) vira pendência dele, e sono curto junto com reação lenta (M7) entra no resumo; vermelho e sintoma vermelho avisam na hora e mostram "Chame o oficial médico agora". Com a N12, dois dias seguidos sem refeição completa também entram no resumo
- [ ] Texto do vermelho por ambiente, usando o `signalDelayLabel` de `ENVIRONMENTS` (`src/content/indicators.ts`) em vez de escrever o atraso à mão. O ambiente vem da **fase da missão** (M8). Na estação: "o solo será avisado no próximo contato". Em Marte, por exemplo: "a decisão é de bordo; o alerta leva de 3 a 22 minutos para chegar à Terra (só a ida)". O atraso é por sentido, não é tempo de resposta do médico (`docs/apresentacao.md`). O texto muda, o nível não
- [x] ~~D4. Projeção linear na tela de tendências~~ (D4 decidida: não fazer) ("se continuar no ritmo dos últimos 7 dias, sai da faixa em cerca de N dias"), com confiança baixa e rótulo "projeção, não previsão". **Recomendação: decidir que não.** A perda óssea estimada (M5) não é projeção: é a média publicada pela NASA multiplicada pelo tempo de missão, mostrada como contexto

## Talita: interface, acessibilidade e alarmes

**Fase 12 (novas)**

- [x] **N12.** Alimentação e água: refeições completas (0 a 3 ou mais) e água suficiente (sim ou não), sem calorias. Dois dias seguidos sem refeição completa geram amarelo (`missedMealDays` em `rules.json`, proposta de demonstração). Campos da v12; a v13 só acrescenta o indicador ao cadastro já gravado
- [x] **N14.** Qualidade do sono, numa escala ao lado das horas, cruzada com a medicação (M1) no gráfico: noites com remédio para dormir marcadas em Tendências → Sono. Remédio "só quando necessário" (`asNeeded`) não gera dose não tomada; a Ana tem um remédio para dormir fictício
- [x] **N21.** Atualizar "Como a NASA mede" em `docs/apresentacao.md` com o que a pesquisa de 15/11 trouxe e com o que a NASA não faz. Feito na seção "O que a pesquisa de 15/11 acrescentou". Falta a Larissa revisar e confirmar a frequência da conferência psicológica ("a cada duas semanas" está sem fonte primária)
- [x] **N16.** Exercício por sessão: tipo, aparelhos usados e minutos em cada um (a duração é a soma), frequência média do aeróbico, resistido feito/parcial/não feito; comparar o volume da semana com o plano e com a linha de base. Depende de D7. Esforço médio
- [ ] ❄️ **N19.** Bloco mensal de sono e equipe, visível só para o próprio tripulante e para o oficial médico, com perguntas próprias marcadas como demonstração. D6 decidiu manter tudo diário na demonstração: fica para depois da entrega. Esforço médio
- [x] **N15.** Visão com grade de Amsler tocável (marca as áreas alteradas), um olho de cada vez, três perguntas, com opção de pular e aviso de que não diagnostica SANS. A cadência específica dos dias de missão fica em N18. Depende de D7. Esforço grande

**Alarmes.** Usar a mesma função dos lembretes da Lorena.

- [x] Alarmes com Web Audio, sem arquivos de som: toque curto no amarelo, padrão repetido no vermelho até alguém confirmar. Função única `raiseAlarm(level, text, options)` em `src/lib/alarm.ts`, pronta para os lembretes da Lorena
- [x] Equivalente visual de todo som: banner fixo com cor, ícone e texto, contador na barra e vibração no celular. Sem piscar mais de 3 vezes por segundo (WCAG 2.3.1). Contador também no título da aba; voz curta só com o nível, sem dado de saúde
- [x] Botão "Silenciar" no banner e volume por nível na tela de missão (WCAG 1.4.2). O vermelho pode ser silenciado, mas o banner só sai quando alguém confirma

**Acessibilidade e layout.**

- [x] Teste de reação acessível: responder com toque, clique **ou** tecla (espaço); o passo pode ser pulado por quem não pode fazer um teste visual; o sinal aparece uma vez por tentativa, sem piscar mais de 3 vezes por segundo (WCAG 2.3.1). Espaço e Enter funcionam mesmo com o foco fora da área de resposta
- [x] Botão "Texto maior", que aumenta a escala base da fonte. No menu do usuário e no aviso inicial; 125%, guardado como preferência do aparelho (`src/lib/textSize.ts`)
- [x] Testar com zoom de 200%, largura de 320 px e espaçamento de texto aumentado (WCAG 1.4.4, 1.4.10 e 1.4.12), incluindo os passos novos do check-in, o teste de reação, o perfil de missão e as metas semanais. Feito com Edge automatizado em todas as telas e perfis; corrigidos: tela de Missão mais larga que a tela, selos e cartões cortados em 320 px, horários do solo, abas da barra escondidas entre 721 e 1300 px. Fica de propósito: a faixa de abas de Tendências rola na horizontal no desktop
- [x] Check-in conferido preenchendo os 16 passos no navegador (15/11): exercício com tipo, aparelhos e minutos; grade de Amsler tocável por olho, com setas, Home e End (o Tab para uma vez só na grade); listas de opção no tamanho normal; rótulo que repetia o título escondido; "De onde veio o valor?" sem espremer; "Pular" na visão não grava mais "sem alteração"
- [x] Perfis de demonstração entram com um toque, sem digitar o PIN (o app usa o PIN de exemplo sozinho); perfis fora da demonstração continuam pedindo o PIN. Aviso de privacidade v8 explica que, assim, qualquer pessoa com o aparelho abre qualquer perfil (`a86ab60`, 15/11)
- [ ] Passada com leitor de tela e só teclado em todas as telas (fase 9). **Teclado: feito** (Tab em todas as telas, foco sempre visível e sem ficar sob a barra ou o alarme). Árvore de acessibilidade conferida (nenhum controle sem nome, sem id repetido, um h1 por tela; o check-in ganhou h1). **Falta a passada manual com NVDA** no Windows ou VoiceOver no celular
- [x] Layout no desktop: lista de regiões alinhada ao topo; chip "Estação" vira "Ambiente: Estação" (na barra até 1100 px o "Ambiente:" fica só para leitor de tela, para as abas caberem)
- [x] Layout no celular: figura menor ou resumo antes dela ("1 região para acompanhar"); nome do tripulante sem corte (cargo na segunda linha); cabeçalho com fundo opaco. Escolhido o resumo antes da figura, sem mudar a figura

## Larissa: pesquisa, LGPD e apresentação

Conferência local de 15/11 após integrar a base remota `7de0df1`: N3, N4, N5, N6 e N8 já foram realizadas pela Larissa no commit `1072f49`, incluindo os textos em português/inglês e as evidências. As marcações correspondentes na seção da Lorena foram sincronizadas, preservando a divisão atual da equipe. Isso não conclui a revisão completa da fase 12: N10 e a revisão dos dados novos abaixo continuam pendentes.

Apresentação, roteiro, capturas, recursos NASA para a entrega e slides ficam para a conclusão de todo o escopo, conforme Larissa. Continuação registrada em `docs/continuidade-larissa-2026-11-15.md`. Revisão documental não equivale a aprovação clínica.

- [x] Revisão documental do escopo já implementado da fase 12: N1, N2, N8, N11, N12, N13, N14 e N17. Evidências e limites em `docs/pesquisa/revisao-faixas.md`; sem alterar cortes ou níveis
- [x] Conferir especificação, privacidade e exportação pelo código para os novos campos; banco v14 e 18 indicadores documentados; aviso de privacidade v7 em português/inglês
- [ ] Completar N10: a N7 ficou pronta em 15/11 (`9e67397`), falta registrar os dois sintomas novos em `docs/pesquisa/revisao-faixas.md`. As perguntas do N19 ficam para depois da entrega (D6). Revisão clínica permanece pendente
- [ ] Entrega da mensagem ao oficial médico. Fazer junto com o Davi
- [ ] Atualizar "De onde vêm os indicadores" em `docs/apresentacao.md`: revisar o texto do teste de reação (a frase "o app não aplica o teste de reação" deixou de ser verdade com a M4) e acrescentar a origem do dado (M10)
- [ ] Reforçar "Como a NASA mede" com os aparelhos reais: dosímetro ativo e pulseira de actigrafia do Artemis II; esteira, bicicleta e aparelho resistido da ISS (cerca de 2 h por dia); flywheel compacto da Orion (cerca de 30 min por dia). Combinar com a N21 da Talita
- [ ] Ligar "O que muda entre ambientes" ao perfil de missão (M8): missões de exemplo (ISS, Artemis II e Marte como referência, não missão real) e as fases
- [ ] Acrescentar em "O que podemos afirmar": perda óssea estimada e radiação acumulada são estimativa e contexto, não medidas nem limites; metas semanais não são prescrição
- [ ] Texto dos recursos da NASA usados, exigido para o Prêmio Global (rascunho em inglês já preparado na conversa com a Talita)
- [x] Textos ajustados à entrada sem PIN da demonstração (`a86ab60`): roteiro, `docs/apresentacao.md`, `README.md` e `docs/como-funciona.md` (15/11)
- [x] `scripts/verify-larissa.mjs` atualizado em 15/11: login sem PIN, troca de perfil da missão como oficial médico, exercício por tipo/aparelho/minutos, painel novo (`.console-region-row`) e só registro manual. Passa inteiro (6 etapas)
- [x] Revisão da refatoração do frontend (`feat/ui-ux-responsive-review`), 15/11: sem rolagem horizontal nem palavra partida em 320, 390, 768, 1280 e 1920 px, pt-BR/EN, com e sem "Texto maior". Corrigidos: rótulo "Tendências" quebrando na barra do celular, tabela de pacotes partindo data e selo, painel da região escondido atrás do alarme vermelho fixo, seletor de idioma colado no rótulo. Conferidos à mão: Amsler por setas, scanner do corpo por teclado, confirmação do alarme, telas do Kenji e Visão do solo
- [x] Alarme vermelho em faixa compacta (15/11): o bloco completo rola com a página e, ao sair da tela, aparece abaixo da barra uma linha só com o vermelho, "+N mais", Silenciar e Confirmar (51 px em vez de cerca de 290 px em 768 px com texto maior)
- [x] Idioma lembrado (15/11): a escolha fica no `localStorage` e vale na próxima abertura; sem escolha, abre em inglês
- [x] Oxímetro (SpO2) no check-in, logo depois da frequência cardíaca, na região Coração: verde 95–100%, amarelo 90–94%, vermelho abaixo de 90% (proposta de demonstração; Larissa revisa a fonte). Entra para todos pela migração v15 (15/11)
- [x] Água em mL no passo de alimentação, comparada com a referência pelo peso (35 mL/kg, mínimo 2 L; `context.hydration`). Abaixo da referência gera o alerta amarelo de alimentação (gatilho `lowWater`). O passo mostra a referência da pessoa antes de salvar (15/11)
- [x] Como medir a pressão: costas apoiadas, pés retos e apoiados sem cruzar (no chão ou, em microgravidade, no apoio de pés), braço apoiado com o manguito na altura do peito (15/11)
- [x] Scanner do corpo refeito: uma faixa luminosa percorre a silhueta inteira a cada 4,5 s sobre uma grade fina; sem piscar e parado com "reduzir movimento" (15/11)
- [ ] Ensaiar o roteiro de novo, porque o check-in tem mais passos. Cenas sugeridas: perfil Artemis II em Missão; a Lia desmarcando o colírio (alerta "Dose não tomada", ligado ao caso de visão dela); o teste de reação em **modo curto**. Refazer as capturas das telas que mudaram
- [ ] Capturas de tela no `README.md` (o link do app publicado já está lá)
- [ ] Slides (a equipe decidiu entregar **7 slides**), vídeo e envio no site do Space Apps. Falta escolher quem faz e confirmar no guia do participante se o envio precisa estar em inglês

## Fora do escopo: leitura de aparelhos

Decidido em 15/11: o Sentinela fica **só com registro manual**. A pergunta "De onde veio o valor?" (M10) saiu do check-in, do painel, da Visão do solo e da demonstração, e o aviso de privacidade foi para a v9. A leitura automática de aparelhos (acesso aos dados da nave, pareamento, conversão de leituras contínuas) não faz parte do projeto.

## Limitações conhecidas

- A lista de medicação prevista fica no registro do tripulante, que não é cifrado (como a lista de indicadores acompanhados). Só os registros diários, com as doses tomadas, são cifrados. Num produto real, o plano de medicação também seria cifrado.
- A lista de medicação prevista não é editável pela interface: vem da demonstração.
- Os dados ficam no navegador onde o app foi aberto. Outro navegador começa com outra demonstração e outra chave de dados, então não consegue abrir os pacotes do primeiro.
- A central de bordo é simulada no próprio navegador: todos os perfis usam o mesmo aparelho.
- Na demonstração, os perfis de exemplo entram sem digitar o PIN: quem tem o aparelho abre qualquer perfil, inclusive o do oficial médico. A separação por papel continua na tela, mas a cifra não separa quem usa o aparelho. Num produto real, cada pessoa digitaria o próprio PIN ou entraria pelo sistema da agência.
- O PIN de 4 a 6 números protege pouco contra quem copiar o banco do aparelho (dá para testar todas as combinações fora do app). Num produto real a chave ficaria no hardware do aparelho ou no sistema da agência.
- O token do backend vai junto do app publicado; só impede gravações de quem não tem o app.
- O app envia pacotes ao backend, mas ainda não busca de volta para recuperar dados num aparelho novo.
- Os lembretes aparecem na tela de missão; não há notificação do sistema.

## Concluído

### Fase 0: pesquisa e documentação

- [x] Pesquisa sobre riscos de saúde em missões longas (`docs/pesquisa/`)
- [x] Proposta do projeto para o Space Apps 2026 (`docs/pesquisa/proposta-space-apps-2026.md`)
- [x] Contexto para assistentes de IA (`CONTEXTO-IA.md`)
- [x] Arquitetura, tipos de dados e convenções (`docs/arquitetura.md`)
- [x] Estrutura de pastas (`docs/estrutura-do-projeto.md`)
- [x] Cinco diagramas (`docs/diagramas/`)

### Fase 1: estrutura do projeto

- [x] Projeto Vite + React 18 + TypeScript, com React Router, Zustand, Dexie, Recharts, vite-plugin-pwa e Vitest
- [x] Árvore de pastas de `src/`, tipos de domínio e utilitários puros com teste
- [x] Repositório no GitHub (privado), `.gitignore` e CI no GitHub Actions (`.github/workflows/ci.yml`)

### Fase 2: motor de regras

- [x] `rules.json` com os dez indicadores, a lista de sintomas, as notas de ambiente e os pares de correlação
- [x] `computeBaselines` (`src/rules/baseline.ts`): primeiros 7 dias válidos, descarta dias fora da faixa geral, pressão em duas séries
- [x] `evaluateRecord` e `levelByRegion` (`src/rules/engine.ts`): pior nível entre faixa geral e desvio pessoal mantido por 3 dias, alerta com as seis partes, confiança baixa com linha de base em formação, aviso ao solo no vermelho
- [x] `findCorrelations` (`src/rules/correlation.ts`): "mudaram juntos", sem afirmar causa
- [x] 29 testes passando (`npm test`)

### Fase 3: dados e estado

- [x] Banco local com três tabelas (`crew`, `records`, `settings`). A linha de base deixou de ser gravada: é recalculada dos registros, como os alertas
- [x] Repositórios `recordsRepo`, `crewRepo` e `settingsRepo`
- [x] `seed.ts`: três tripulantes fictícios e 60 dias terminando ontem, com dois casos preparados (Ana: sono e humor caem juntos por 7 dias; Lia: mudança leve na visão e dor de cabeça; Kenji: tudo normal, único que acompanha glicemia)
- [x] Store Zustand com `loadCrew`, `saveCheckin`, `setEnvironment`, `switchCrew`, `setReminder` e `resetDemo`
- [x] Seletor de tripulante e ambiente atual na barra de navegação

### Fase 4: check-in diário

- [x] Textos "como medir" e "por que medir" dos dez indicadores (`src/content/indicators.ts`)
- [x] Passos para número, escala e lista de marcar; um indicador por passo, só os acompanhados, qualquer passo pode ser pulado
- [x] Validação de digitação (aceita vírgula), revisão antes de salvar e resumo com os alertas do dia
- [x] Refazer o check-in do mesmo dia substitui o registro

### Fase 5: painel com o corpo humano

- [x] Figura humana em SVG com sete regiões clicáveis e acessíveis pelo teclado, com ícone além da cor
- [x] Lista de regiões ao lado da figura e painel de detalhe com valor, nível, linha de base e atalhos
- [x] Aviso de check-in pendente

### Fase 6: alertas e ações

- [x] Cartão com as seis partes, nota do ambiente e marcação de aviso ao solo
- [x] Tela de alertas com resumo por nível e seção "Mudaram juntos"

### Fase 7: tendências, missão e correlações

- [x] Gráfico com faixa geral sombreada, linha de base tracejada, dica ao passar o mouse e tabela de valores; períodos de 14, 30 e 60 dias
- [x] Tela de missão: ambiente, dia da missão, sequência de check-ins, lembretes por indicador e recriar a demonstração
- [x] Correlações no painel da região e na tela de alertas

### Fase 8: PWA

- [x] `vite-plugin-pwa` configurado, com manifesto e ícone SVG
- [x] Tela de tendências carregada sob demanda (o build não passa de 500 kB por arquivo)
- [x] Ícones PNG de 192 e 512 px (mais o maskable para Android e o apple-touch-icon de 180 px para iPhone)

### Fase 9: entrega

- [x] Roteiro da demonstração e respostas a perguntas (`docs/roteiro-demonstracao.md`); capturas das novas telas e teste de integração em `scripts/verify-larissa.mjs`

### Fase 10: pontos da reunião da equipe (14/11)

Tarefas tiradas do documento interno de respostas aos pontos da reunião de 14/11 (peçam ao Davi).

**Decisões**

- [x] **D1. Central de bordo:** simulada no navegador. A sincronização é automática, sem opção de ligar ou desligar. Um backend simples na Terra guarda e sincroniza os pacotes (só isso), para a tripulação não perder dados em longos períodos sem comunicação.
- [x] **D2. Comandante:** vê só "check-in feito ou pendente" e se há alerta vermelho (sim/não). Dos próprios dados vê tudo, como tripulante.

**Davi**

- [x] Papéis: tripulante (só os próprios dados), oficial médico de bordo (todos; Kenji na demo) e médico do solo (só os pacotes que chegaram à Terra) (`src/lib/access.ts`)
- [x] D2. Papel de comandante (Ana na demo): tela Tripulação só com check-in feito/pendente e alerta vermelho sim/não (`CrewStatusPage`, `loadCrewStatus`); a consulta entra no registro de acesso
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
- [x] Revisão do código da fase 10 (revisor): corrigidos os 2 críticos e a maior parte dos importantes. Carga atrasada não grava mais dados de outra sessão no store; "visto" deixa de valer se o check-in for refeito ou o nível mudar; o médico do solo só abre pacotes entregues; pacote montado antes de marcar a fila como sincronizada; pacote congelado depois da primeira tentativa de envio; ciclos sem pedido perdido e com erro visível na tela; lotes de 100; trava entre abas; recriar a demonstração espera o ciclo; linhas ilegíveis são puladas; leitura no servidor com `READ_TOKEN` próprio; pausa de PIN por perfil; id aleatório no registro de acesso
- [x] Uma chave de dados por tripulante (cifrada no PIN do dono e no do oficial médico). Pacote do solo e resumo do comandante selados por chave pública na hora do check-in; a central só move caixas seladas. Conteúdo preso ao id (AAD). 10 testes em `src/data/isolation.test.ts` provam que um perfil não abre os dados dos outros nem lendo o banco direto
- [x] Prender o conteúdo cifrado ao registro (AES-GCM com `id` como dado adicional). Conferido em 15/11: era o mesmo trabalho da tarefa acima; `recordsRepo`, `messagesRepo`, `reviewsRepo` e `packetsRepo` já passam o id como AAD
- [x] `docs/arquitetura.md`, `docs/estrutura-do-projeto.md` e diagramas 01, 03, 05 e 06 (novo: sincronização) atualizados com papéis, central e backend

**Talita**

- [x] Contraste em `src/styles/tokens.css`: `--text-faint` para `#8f9dba` e `--level-none` para `#8494b0`
- [x] Fontes de 11 px para no mínimo 12 px (barra com 14 px; 12 px abaixo de 420 px de largura, para "Tendências" caber; contador com 12 px)
- [x] Nada piscando mais de 3 vezes por segundo (WCAG 2.3.1). O único pulso, do vermelho no mapa, repete a cada 1,6 s

**Lorena**

- [x] i18n com `react-i18next`: inglês como padrão e português como tradução, arquivos em `src/locales/en/` e `src/locales/pt-BR/` por área (comum, check-in, alertas, indicadores)
- [x] Passar para chaves os textos de `src/content/indicators.ts`, das telas e os textos de alerta do `rules.json`, incluindo os textos novos da fase 11
- [x] Datas e números com `Intl` (5.2 h em inglês, 5,2 h em português); a digitação continua aceitando vírgula e ponto
- [x] Atualizar o `lang` do `<html>` ao trocar de idioma (WCAG 3.1.1) e um teste que falha se faltar chave em um dos idiomas
- [x] Lembrete do teste de reação (M4): opção "a cada 4 dias" na lista de lembretes, como na ISS

**Larissa**

- [x] Revisão **documental** das faixas, com referências e limites de evidência por nível em `rules.json` (`rangeEvidence`) e `docs/pesquisa/revisao-faixas.md`. Aprovação clínica da fase 2 continua pendente; nenhum corte numérico foi alterado
- [x] (M1–M3) Revisão documental de medicação, estresse, carga e treino resistido, com NASA e estudos originais, limites de evidência e referências no `rangeEvidence`. Cortes mantidos; não constitui aprovação clínica
- [x] (M5–M6) Revisão documental da taxa óssea NASA e sua população/período, com estudo original complementar; avisos de extrapolação. Revisados também os limites da soma de radiação: valores informados, dias ausentes e ausência de conexão com dosímetro ou limite de carreira
- [x] (M4/M7/M9) Revisão do teste de reação, associação genérica com sono e metas de cinco em sete dias. Registrados limites, critérios demonstrativos e diferenças em relação ao RST NASA; sem diagnóstico de fadiga. M7 não implementa corte específico de sono ≤6 h
- [x] (M4) Guardar modo, conclusão, duração e contagens do teste; curto, interrompido e legado sem modo ficam para consulta/exportação e fora da série pessoal
- [x] (M11) Conferir evento planejado, janela de sete dias e dia do retorno; documentar que é orientação educativa, sem detectar pouso nem definir risco individual
- [x] Nota educativa pelo sexo em Missão, com fonte NASA e orientação de readaptação à gravidade. Não muda faixas nem níveis; sem `sex`, usa texto geral
- [x] Texto e tela "Seus dados": finalidade, acesso real no protótipo, retenção, cópia JSON por perfil e pedido local de exclusão. O tripulante não exclui o próprio histórico (decisão da equipe em 14/11). Limites em `docs/privacidade.md`
- [x] (M1–M3) Privacidade em `docs/privacidade.md`, aviso versionado e "Seus dados": plano de medicação sem cifra, valores diários cifrados e JSON baixado legível sem cifra. Corrigida a promessa de exclusão imediata de mensagens
- [x] (M5–M6/M8) Privacidade dos cálculos derivados e das preferências de missão compartilhadas sem cifra, fora da cópia individual; aviso v5. Script de integração ampliado ao perfil de missão e ao contexto ósseo/radiação
- [x] (M4/M10) Privacidade e exportação do resultado e detalhes do teste de reação e origem declarada cifrados junto do registro; aviso v6. Sem alegar conexão com aparelhos
- [x] Adaptar, corrigir e executar `scripts/verify-larissa.mjs`: login por PIN, check-in M1–M3, reação curta e interrompida, origem declarada, JSON legível e restrito ao perfil, pedido sem exclusão, persistência e reset pelo oficial médico
- [x] Aviso antes da primeira entrada: finalidade e limites da base legal (art. 11, II, f), sem presumir tutela da saúde ou consentimento genérico para o hackathon
- [x] Composição e histórico local de mensagem para **mostrar** ao oficial médico, com indicação de não enviada, validação, exportação e exclusão
- [x] Conteúdo no Git sobre como a NASA mede e onde o Sentinela entra (`docs/apresentacao.md`)
- [x] Justificativa dos dados simulados, sem afirmar inexistência absoluta de conjuntos públicos (`docs/apresentacao.md`)
- [x] Comparação de ambientes e limites da evidência humana; atraso de Marte por sentido, não tempo de resposta médica (`docs/apresentacao.md`)
- [x] Limites de medição, comparação, predição e autenticação institucional futura (`docs/apresentacao.md`)

### Fase 11: melhorias alinhadas ao desafio oficial

O desafio pede um software que **reúna indicadores de saúde e permita ao astronauta avaliar e agir** sobre o próprio estado, citando imunidade, ossos, coração e saúde mental.

- [x] **M1. Medicação**: indicador "tomei a medicação prevista", com lista por tripulante e lembrete
- [x] **M2. Estresse e carga de trabalho**: duas escalas de 1 a 5 no check-in, na região "Mente e sono" (perguntas do Reaction Self Test da NASA)
- [x] **M3. Tipo de exercício**: aeróbico separado de resistido
- [x] **M4. Teste de reação de 3 minutos**, com linha de base pessoal, modo curto (cerca de 30 s) e lembrete "a cada 4 dias"
- [x] **M5. Perda óssea estimada pelo dia de missão** (1% a 1,5% ao mês), como "estimativa, não medida", sem faixa de alerta
- [x] **M6. Radiação acumulada na missão**: soma das doses do dia, como contexto
- [x] **M7. Sono e reação mudaram juntos**: correlação genérica, sem afirmar causa nem diagnosticar fadiga
- [x] **M8. Perfil de missão**: nave, tripulação, duração e fases, com modelos ISS, Artemis II e Marte (referência, não missão real); a fase define o ambiente
- [x] **M9. Metas semanais de sono e exercício**
- [x] **M10. Origem do dado**: "digitado", "pulseira" ou "dosímetro", com nomes genéricos e o Artemis II só como exemplo. O opcional de importar arquivo de exemplo da pulseira não foi feito
- [x] **M11. Readaptação à gravidade**: destaque da orientação de tontura ao levantar perto do fim da missão
