# Revisão documental das faixas

Revisão de Larissa, iniciada em 14/11/2026 e complementada em 15/11/2026 para M1–M3 da branch da Talita. Esta é uma conferência de rastreabilidade, não uma validação médica. Os números existentes foram mantidos para preservar a demonstração; todas as regras continuam com `demo: true`.

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
| Visão | Escala própria 0–2. Os níveis não diagnosticam SANS, e a fonte não valida esse autoteste. | [NASA: SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) |
| Radiação | Sem faixa geral. O algoritmo pessoal é demonstrativo e não representa limite de exposição; não cobre dose acumulada ou eventos agudos. Cerca de 150 µSv/dia no Radi-N2 descreve somente nêutrons na ISS. | [CSA: Radi-N2](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) |
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

### Itens que aguardam implementação

M4 (teste de reação), M5 (estimativa óssea), M7 (fadiga) e M9 (metas semanais) não estão implementadas nesta base. Seus cortes e textos finais ainda não foram revisados nem aprovados. A revisão destes itens permanece aberta; não antecipar uma validação a partir de tarefas planejadas. Apresentação, roteiro e material da entrega serão revisados após a conclusão do escopo, conforme Larissa.

## O que ainda depende da equipe

Antes de mudar faixas ou retirar `demo`, obter revisão de profissional qualificado: população, condição de repouso/jejum, método de medida, referências, limites de ação, exceções e conduta para cada nível. Registrar a decisão e atualizar testes, `rules.json` e `docs/como-funciona.md` juntos. Essa aprovação clínica continua pendente no `TASKS.md`.

## Contexto por sexo

O [brief da NASA sobre intolerância ortostática](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf) descreve problemas de adaptação ao retornar à gravidade e diferenças observadas entre mulheres e homens. O app mostra uma nota educativa na tela Missão, com destaque para mulheres, sem inferir risco individual. A nota trata de readaptação, não de uma ocorrência atual. Não altera valores, linha de base, níveis nem condutas do motor. Sexo não é inferido do nome; o campo opcional `sex` vem do perfil fictício. Sem esse campo, a orientação permanece geral.
