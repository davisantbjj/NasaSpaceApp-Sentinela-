# Revisão documental das faixas

Revisão de Larissa, iniciada em 14/11/2026 e ampliada em 15/11/2026 até a fase 12. Esta é uma conferência de rastreabilidade, não uma validação médica. Esta revisão não altera cortes. A maioria das regras tem `demo: true`; condicionamento (N17) tem `demo: false` no código por citar um requisito oficial, sem que isso valide o método do app ou a classificação de alerta.

Cada indicador em `src/rules/rules.json` agora tem `rangeEvidence`: referências gerais, justificativa e limites de evidência separados para verde, amarelo e vermelho. `sourceUrl` continua sendo a fonte do risco e da explicação; não deve ser interpretado como validação de todos os cortes numéricos.

| Indicador | Resultado da revisão | Referência |
| --- | --- | --- |
| Pressão | 100–130/60–85 e a amarela 90–140/55–90 são escolhas de demonstração. Não correspondem à referência geral consultada de 90/60–120/80; avaliar os números separadamente também precisa de justificativa clínica. | [MedlinePlus: sinais vitais](https://medlineplus.gov/ency/article/002341.htm) |
| Frequência cardíaca | Verde 60–100 bpm tem referência geral para adultos saudáveis em repouso. Amarela 50–120 e vermelho fora dela não foram validados como triagem espacial. | [MedlinePlus](https://medlineplus.gov/ency/article/002341.htm) |
| Temperatura | O verde existente 36,1–37,2 °C difere dos 36,5–37,3 °C da referência consultada. Verde e amarelo permanecem demonstrativos. É necessário especificar local, instrumento e método antes de validar cortes. | [MedlinePlus](https://medlineplus.gov/ency/article/002341.htm) |
| Glicemia | O NIDDK apresenta até 99 e 100–125 mg/dL para glicemia **plasmática de jejum**, não urgência de leitura capilar. O limite 70 vem de orientação de hipoglicemia em contexto de diabetes. Combinar referências não valida o intervalo 70–99 do app; 60–125 e o vermelho também são demonstração. | [Diagnóstico](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis), [hipoglicemia](https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/low-blood-glucose-hypoglycemia) |
| Sono | 7–9 h é uma referência geral para a maioria dos adultos. Amarela 5–10 e vermelho fora dela são escolhas do protótipo, sem validação de urgência. | [NICHD: sono](https://www.nichd.nih.gov/health/topics/factsheets/sleep) |
| Exercício | A NASA descreve média de aproximadamente duas horas diárias na ISS. Isso não valida 60–150, 30–180 ou limites universais; prescrição, intensidade e modalidade importam. | [NASA: Astronaut Exercise](https://www.nasa.gov/general/astronaut-exercise/) |
| Humor | Escala própria 1–5, com cortes 4/3/2. A fonte explica o risco comportamental, sem validar a escala ou seus níveis. | [NASA: risco comportamental](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) |
| Visão | N15 substitui a entrada da escala por grade de Amsler e perguntas por olho, mantendo um resumo 0–2 para as regras. A interface não equivale a exame clínico nem diagnostica SANS; a cadência depende de N18. | [NASA: SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) |
| Radiação | Sem faixa geral. O algoritmo pessoal é demonstrativo e não representa limite de exposição ou de dose acumulada, nem detecta eventos agudos. M6 soma as doses registradas apenas como contexto. Cerca de 150 µSv/dia no Radi-N2 descreve somente nêutrons na ISS. | [CSA: Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) |
| Sintomas | A classificação fixa de cada sintoma é de demonstração. A página de riscos da NASA fornece contexto, sem validar uma regra de triagem para essa lista. | [NASA: riscos](https://www.nasa.gov/hrp/risks/) |

Os parâmetros de linha de base (7 amostras), persistência (3 registros) e desvio (15%) também são decisões de demonstração, sem validação clínica. Registros não precisam ser dias consecutivos no calendário no motor atual. Ausência de alerta significa apenas ausência de gatilho nas regras disponíveis, não ausência de risco.

## Complemento M1–M3: evidência e comportamento conferido

Consulta às fontes em 15/11/2026. Escopo implementado: medicação, estresse, carga de trabalho e separação do exercício em aeróbico e resistido. `exerciseMinutes` continua sendo o **total** dos dois tempos; `resistanceMinutes` guarda a parcela resistida. Não somar novamente a parcela resistida ao total em análises ou exportações.

| Indicador | Regra atual e limite de interpretação | Fontes |
| --- | --- | --- |
| Medicação (M1) | Autorrelato: todas as marcações tomadas não geram alerta; uma ou mais não tomadas geram amarelo, nunca vermelho por este indicador. Pular o passo deixa o valor ausente: não comprova adesão. A lista guarda uma marcação por medicamento, mesmo quando o horário diz “2 vezes ao dia”; não é um registro individual de cada dose. Não mede eficácia, estoque ou efeitos adversos. | [NASA/NTRS: Dose Tracker, Wotring e Smith, 2015](https://ntrs.nasa.gov/citations/20150014490); [Wotring, 2020, estudo original](https://pubmed.ncbi.nlm.nih.gov/31852573/) |
| Estresse e carga (M2) | Escalas próprias de 1–5; 1–3 sem gatilho e 4–5 amarelo. Sem linha de base e sem vermelho para respostas válidas. A motivação vem do RST, mas a escala e esses cortes não foram validados pelas fontes como classificação psicológica ou urgência. | [NASA: PVT/RST](https://techport.nasa.gov/projects/23201); [Jones et al., 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/) |
| Treino resistido (M3) | Sem faixa geral; apenas desvio para baixo do padrão pessoal, com os parâmetros demonstrativos existentes (7 amostras, mais de 15%, persistência de 3 registros com valor). Só chega ao amarelo; ausência de alerta não atesta treino suficiente. Minutos não representam carga, séries, intensidade nem o plano individual. | [NASA: exercício na ISS](https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/); [English et al., 2020, SPRINT](https://pmc.ncbi.nlm.nih.gov/articles/PMC7434884/) |

### Por que estas fontes foram escolhidas

- **Dose Tracker:** a apresentação NASA/NTRS descreve a coleta de uso de medicamentos e efeitos percebidos. O estudo publicado acompanhou seis participantes em voo e cinco em solo antes da interrupção antecipada. Sustenta registrar uso, mas não valida a regra “qualquer dose não tomada = amarelo”, nem a ausência de vermelho para todos os medicamentos. Referência: Wotring VE, *Dose Tracker Application for Collecting Medication Use Data from International Space Station Crew*, Aerospace Medicine and Human Performance, 2020;91(1):41–45, [PMID 31852573](https://pubmed.ncbi.nlm.nih.gov/31852573/).
- **Estresse e carga:** o estudo observacional de Jones e colaboradores acompanhou 24 astronautas em missões de aproximadamente seis meses e encontrou associação entre sono curto, desempenho e estresse. Usou escalas visuais analógicas de autorrelato, diferentes das cinco opções do Sentinela. Associação não demonstra causalidade nem permite diagnóstico individual. Referência: *Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress in astronauts on six-month missions aboard the International Space Station*, Sleep, 2022, [texto e métodos](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/).
- **Exercício:** o SPRINT comparou nove participantes no programa experimental com 17 no grupo de comparação, em voos longos. Intensidade e volume foram considerados, com limitações de amostra e evolução do programa de comparação. Sustenta distinguir modalidades; não oferece um corte universal em minutos nem valida o algoritmo pessoal do app. Referência: English KL et al., *High intensity training during spaceflight: results from the NASA Sprint Study*, npj Microgravity, 2020;6:21, [doi:10.1038/s41526-020-00111-x](https://doi.org/10.1038/s41526-020-00111-x).

## Complemento M5–M6 após a atualização da Talita

### Estimativa óssea (M5)

A [NASA: risco de alterações ósseas](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) apresenta perda **média de 1%–1,5% ao mês** em ossos que sustentam peso, em missões de **4–6 meses**. É uma descrição de grupo, com incerteza sobre a manutenção da taxa em missões mais longas. Não valida uma curva linear diária, uma previsão individual ou uma taxa para Lua/Marte.

O app calcula `dias em estação/trânsito ÷ 30 × taxa mensal`. O mês de 30 dias, o ritmo constante e aplicar a média a uma pessoa são simplificações da demonstração. Dias em gravidade parcial são excluídos por falta de taxa validada, **não** porque tenham risco zero. Sem perfil, todos os dias são atribuídos ao ambiente atual; com perfil, usa-se o cronograma de referência, não um histórico de exposição medido. Trocar o perfil pode recalcular o passado ilustrativo. A conta não ajusta exercício, nutrição, tratamento, local do esqueleto ou recuperação entre fases.

Foi mantida a fórmula e reforçado o texto: não mede nem prevê perda individual; há aviso de extrapolação abaixo de 4 e acima de 6 meses. `context.boneLoss.demo` passou a `true`, pois a conta do protótipo é ilustrativa mesmo que a taxa venha de fonte oficial. Não há faixa de alerta ou mudança de nível decorrente dela.

Como estudo original complementar, [Gabel et al., Scientific Reports, 2022;12:9446](https://pmc.ncbi.nlm.nih.gov/articles/PMC9247070/), doi:10.1038/s41598-022-13461-1, acompanhou 17 astronautas com tomografia de alta resolução de tíbia e rádio antes/depois do voo e durante a recuperação. Nove não recuperaram completamente a densidade total da tíbia em 12 meses. Isso reforça a variabilidade e a necessidade de medição direta; o estudo não valida a fórmula do Sentinela nem transforma a média NASA em prescrição ou diagnóstico.

### Radiação acumulada (M6/N2)

A [NASA: risco de câncer induzido por radiação](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/) sustenta acompanhar exposição e seus riscos, mas não valida os valores simulados, a qualidade do dado digitado ou um limite de carreira no app. O código soma valores finitos não negativos em µSv e apresenta mSv a partir de 1.000 µSv. Zero é valor válido; dados ausentes não recebem dose presumida.

O resultado é **soma dos valores informados**, não medição direta da exposição total. A N2 também apresenta essa soma como estimativa e percentual do limite de carreira de 600 mSv, podendo incluir `priorCareerDoseMsv` informado para missões anteriores. Isso é contexto, não um alerta: o cálculo oficial da NASA usa dose efetiva e avaliação especializada, portanto o percentual não representa uma avaliação clínica ou ocupacional.

Dias sem leitura tornam o registro incompleto: não é possível quantificar esses dias nem afirmar estritamente que a dose real seja maior. Não há conexão com dosímetro, correção por tipo de radiação ou cálculo de eventos solares. Não misturar componentes distintos de dose nem aplicar os 150 µSv/dia de nêutrons do Radi-N2 como dose total universal. Os dados atuais são fictícios. Nenhum alerta é gerado pela soma.

## Complemento após Talita `ec23abd`: M4, M7, M9, M10 e M11

Consulta documental em 15/11/2026. Todas as melhorias M1–M11 agora têm implementação na base integrada; a revisão abaixo descreve os limites efetivos, sem aprovação clínica. Apresentação e material da entrega continuam para depois da conclusão do escopo.

### Reação e associação com sono (M4/M7)

A [NASA: PVT/RST](https://techport.nasa.gov/projects/23201) descreve um protocolo breve com características específicas de temporização e análise, validado em relação ao PVT de dez minutos. Ter três minutos de duração não torna o teste do app equivalente. Latência do navegador, tela, aparelho, método de resposta e interrupções podem afetar a média. Espera aleatória de 1–4 s, exclusão de respostas abaixo de 100 ms e mínimo de três respostas são escolhas desta implementação, não critérios clínicos aprovados.

O estudo original de [Jones et al., Sleep, 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/) acompanhou 24 astronautas em missões de cerca de seis meses. Usou PVT breve e autorrelato, com sessões matutinas/noturnas a cada quatro dias. Encontrou associação entre sono de seis horas ou menos e pior desempenho; não valida o modo curto de 30 s, média isolada ou corte de 15% do Sentinela. O lembrete de quatro dias é uma opção inspirada no estudo, não uma prescrição para todos.

No app, o alerta continua demonstrativo: sete amostras para formar linha de base e mais de 15% de lentidão por três registros válidos, sem faixa geral e sem vermelho. Apenas testes completos concluídos com modo registrado entram na série, linha de base, alertas e correlações. Modo curto, interrompido e legado sem identificação são preservados para consulta/exportação, sem comparação. Os números simulados antigos não recebem um protocolo retroativamente; a linha de base pode precisar ser formada novamente. Mesmo entre testes completos, usar o mesmo aparelho e forma de resposta reduz uma fonte de variação, sem validar o método.

**M7 usa a correlação genérica:** ambos os indicadores precisam se afastar do esperado nos últimos três registros. Sono pode se afastar por faixa geral (atualmente abaixo de 7 ou acima de 9 h) ou desvio pessoal; não existe regra exclusiva `sono ≤ 6 h`. A reação precisa de linha de base pronta. Não é um coeficiente estatístico nem diagnóstico de fadiga; não altera nível, não afirma causa e os registros não precisam ser dias consecutivos. O texto da task foi ajustado para não prometer a regra específica que o código não implementa.

### Metas semanais (M9)

O código conta, nos últimos sete dias incluindo hoje, quantos registros de sono e exercício total caem nas faixas verdes gerais existentes. A meta de cinco dias em sete é escolha de demonstração, sem referência que valide esse número como prescrição. A faixa de sono é referência geral; os limites de exercício continuam demonstrativos. Dias sem dado não contam como êxito e não comprovam descumprimento de um plano médico. Não há meta independente de sessões resistidas. A conquista não certifica saúde, adesão ou aptidão; não modifica alertas. Ausência de registro e valor fora da faixa devem ser interpretados separadamente pela equipe.

### Origem declarada (M10)

`values.sources` indica onde a pessoa diz ter lido ou copiado o valor: `wearable` ou `dosimeter`. `manual`/ausente significa digitado; campos antigos não permitem inferir retrospectivamente um aparelho. Todos os valores continuam inseridos manualmente; não há API, pareamento, identificação do aparelho, dado bruto ou verificação de autenticidade. Não tratar a etiqueta como garantia de precisão. A privacidade e a exportação foram atualizadas sem anunciar leitura automática.

### Readaptação (M11)

O [brief NASA sobre intolerância ortostática](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf) sustenta orientar sobre dificuldades ao voltar à gravidade. O app destaca a nota nos sete dias anteriores e no dia de um pouso previsto ou retorno à Terra; esse intervalo é escolha de interface, não limiar clínico. Usa fases planejadas, não detecção de pouso ou sintoma. Após a data, não garante acompanhamento: pode deixar de haver próxima mudança. Não mede pressão ao levantar, não diagnostica intolerância nem define tratamento; não muda níveis. Dias em Lua/Marte são contexto de missão, sem extrapolar incidência humana observada no retorno à Terra.

## Revisão NASA N3–N6 e N8 — Larissa, 15/11/2026

Textos do app corrigidos em português e inglês, com referências no rangeEvidence. Faixas, níveis e algoritmos preservados.

- **N3 — visão:** [Greenwald et al., NASA, 2022](https://ntrs.nasa.gov/citations/20220005320) descrevem sinais precoces por OCT em cerca de 70% nas missões longas. O [OCHMO-TB-033 Rev C, 2023, p. 5](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf) informa edema do disco óptico em 16% durante/após missões longas. Critérios diferentes: não apresentar como uma única taxa nem probabilidade individual. O autorrelato 0–2 não detecta esses achados nem diagnostica SANS.
- **N4 — pressão:** [Norsk et al., 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4324706/): oito astronautas, todos homens; médias ambulatoriais de 24 h em voo reduzidas em 8 mmHg na sistólica e 9 mmHg na diastólica, sem mudança da frequência cardíaca. Amostra pequena: não subtrair esses valores de cada pessoa nem alterar faixas.
- **N5 — sono:** [Jones et al., 2022](https://doi.org/10.1093/sleep/zsac006): 24 astronautas; associação de sono ≤6 h com pior desempenho e maior estresse. Não valida a faixa amarela 5–10 h, o vermelho, causalidade ou limite de urgência. O app continua sem regra específica de seis horas.
- **N6 — sintomas:** [OCHMO-TB-033 Rev C, p. 4 e 9](https://www.nasa.gov/wp-content/uploads/2023/07/ochmo-tb-033-spaceflight-experience-medical-care-rev-c.pdf): adaptação espacial em 50–70%, congestão em mais de 50%, dor lombar de adaptação em 52% e uso de auxiliares do sono em cerca de 71%. Frequências descritivas, não pesos de alerta nem validação da triagem.
- **N8 — glicemia:** incluída pelo desafio; não encontramos rotina de monitoramento em voo nas fontes NASA consultadas. Isso não prova inexistência de pesquisas ou indicações individuais. Removidas a promessa de avaliar alimentação pela glicemia e sua atribuição direta ao risco de nutrição. Massa corporal mantém esse vínculo; alimentação continua proposta em N12. As limitações das referências NIDDK permanecem.

**N10: revisão dos itens implementados realizada; fechamento depende de N7.** A seção seguinte completa N1/N2 e os dados novos já disponíveis. N7 e as perguntas de N19 permanecem sem implementação nesta base; não há revisão de comportamento desses itens para aprovar.

## Conferência da fase 12 — Larissa, 15/11/2026

Base conferida: `2769fb5`. Faixas e condutas preservadas. Fontes abaixo contextualizam requisitos ou observações; não certificam o protótipo.

| Item | Código atual | Evidência e limite |
| --- | --- | --- |
| N1 — temperatura | Faixas gerais preservadas; linha de base fixa dos sete primeiros valores válidos; desvio acima de 1% por três registros. | [Stahn et al., 2017](https://doi.org/10.1038/s41598-017-15560-w): 11 astronautas, aumento gradual de temperatura central de cerca de 1 °C em 2,5 meses, com sensor de superfície/fluxo de calor. Não valida termômetro comum, percentual em °C ou faixas do app. A linha de base não acompanha adaptação lenta; o pior nível com a faixa geral continua valendo. |
| N2 — radiação | Soma leituras finitas não negativas; converte µSv em mSv e adiciona dose anterior informada. Compara com 600 mSv sem gerar alerta pelo acumulado. | [OCHMO-TB-020 Rev G, 06/06/2025](https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf): limite de carreira em dose efetiva de 600 mSv; evento solar tem requisito separado de 250 mSv, não implementado. A soma de leituras não calcula dose efetiva oficial. Dose anterior ausente entra como zero no cálculo, sem comprovar ausência de exposição; dias faltantes não recebem estimativa. |
| N11 — massa corporal | Perda `(inicial − atual) / inicial × 100`; amarelo estritamente acima de 5%, vermelho estritamente acima de 10%. Exatamente 5% não alerta; exatamente 10% permanece amarelo. Sem referência inicial válida, não gera esse alerta. | [Zwart et al., 2014](https://pubmed.ncbi.nlm.nih.gov/25197887/): 25 tripulantes medidos nos dois aparelhos; perdas médias diferentes conforme o dispositivo (4,4% BMMD, 2,8% SLAMMD). Isso não é uma faixa individual nem valida os cortes 5/10%. Instrumento, referência pré-voo e método precisam ser comparáveis. |
| N12 — alimentação/água | Zero refeições completas em dois dias consecutivos no calendário gera amarelo; dia ausente interrompe a sequência. Água insuficiente é guardada, sem alerta próprio. | [NASA: Nutritional Biochemistry](https://www.nasa.gov/directorates/esdmd/hhp/nutritional-biochemistry/) descreve o ISS Food Intake Tracker. Sustenta registrar alimentação, sem validar nossa pergunta, definição de refeição completa, quantidade suficiente de água ou espera de dois dias. Um registro com refeições não comprova nutrição adequada. |
| N13 — CO₂ | Um valor compartilhado em `settings`, entendido como média de uma hora; aviso se maior que 3 mmHg. Dor de cabeça/congestão recebem orientação adicional nesse contexto, sem mudar o nível por esse motivo. | [OCHMO-TB-004 Rev D, 10/03/2026](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf): limite de média de uma hora de 3 mmHg. O app não integra uma hora de amostras, não conhece validade temporal e não monitora a cabine. A relação com sintomas não prova causa; ausência de aviso não certifica atmosfera segura. |
| N14 — qualidade do sono | Autorrelato 1–5 no passo de sono; marcação de medicamento `sleepAid` tomado no gráfico. Não tem corte de alerta próprio. | [Standard Measures, 2020, p. 7](https://ntrs.nasa.gov/api/citations/20200001281/downloads/20200001281.pdf) inclui quantidade/qualidade de sono em questionário mensal. Não valida nossa escala diária nem equivale ao questionário original. Comparar noites com medicamento não prova efeito ou causalidade. |
| N17 — condicionamento | Percentuais aeróbico e de força informados, com aparelho; cada componente abaixo de 80% gera amarelo. Exatamente 80% não alerta; não há vermelho nem linha de base calculada pelo app. | [NASA-STD-3001: Human Performance, V1 4003 e requisitos de força](https://www.nasa.gov/reference/4-0-human-performance/) sustenta manter ao menos 80% dos valores pré-missão. O app não mede VO₂ ou força nem calcula o percentual a partir de exames brutos. Aparelho declarado não identifica protocolo, carga ou unidade original. `demo: false` identifica a origem do número, sem validar a conversão em amarelo, as medições inseridas ou aptidão individual. Cadência segue pendente em N18. |

### Pendências específicas após a conferência

- N7: revisar os dois sintomas e seus níveis quando implementados. Os percentuais epidemiológicos de N6 não determinam prioridade individual.
- N19: revisar perguntas, finalidade e acesso quando houver definição e implementação; não presumir que respostas sobre colegas tenham o mesmo fluxo de compartilhamento dos check-ins.
- Revisão clínica/operacional: validar métodos, cortes demonstrativos e condutas. A classificação oficial de um requisito não valida a interface nem torna todos os dados comparáveis.
- Limites de privacidade dos novos dados estão em [privacidade](../privacidade.md); referência inicial de massa e dose anterior estão no cadastro aberto, não nos valores diários cifrados.

## O que ainda depende da equipe

Antes de mudar faixas ou retirar `demo`, obter revisão de profissional qualificado: população, condição de repouso/jejum, método de medida, referências, limites de ação, exceções e conduta para cada nível. Registrar a decisão e atualizar testes, `rules.json` e `docs/como-funciona.md` juntos. Essa aprovação clínica continua pendente no `TASKS.md`.

## Contexto por sexo

O [brief da NASA sobre intolerância ortostática](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf) descreve problemas de adaptação ao retornar à gravidade e diferenças observadas entre mulheres e homens. O app mostra uma nota educativa na tela Missão, com destaque para mulheres, sem inferir risco individual. A nota trata de readaptação, não de uma ocorrência atual. Não altera valores, linha de base, níveis nem condutas do motor. Sexo não é inferido do nome; o campo opcional `sex` vem do perfil fictício. Sem esse campo, a orientação permanece geral.
