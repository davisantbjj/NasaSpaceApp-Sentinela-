# Revisão documental das faixas

Revisão de Larissa, em 14/11/2026. Esta é uma conferência de rastreabilidade, não uma validação médica. Os números existentes foram mantidos para preservar a demonstração; todas as regras continuam com `demo: true`.

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

## O que ainda depende da equipe

Antes de mudar faixas ou retirar `demo`, obter revisão de profissional qualificado: população, condição de repouso/jejum, método de medida, referências, limites de ação, exceções e conduta para cada nível. Registrar a decisão e atualizar testes, `rules.json` e `docs/como-funciona.md` juntos. Essa aprovação clínica continua pendente no `TASKS.md`.

## Contexto por sexo

O [brief da NASA sobre intolerância ortostática](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-019-orthostatic-intolerance.pdf) descreve problemas de adaptação ao retornar à gravidade e diferenças observadas entre mulheres e homens. O app mostra uma nota educativa na tela Missão, com destaque para mulheres, sem inferir risco individual. A nota trata de readaptação, não de uma ocorrência atual. Não altera valores, linha de base, níveis nem condutas do motor. Sexo não é inferido do nome; o campo opcional `sex` vem do perfil fictício. Sem esse campo, a orientação permanece geral.
