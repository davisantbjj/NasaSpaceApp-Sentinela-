# Base de conteúdo para a apresentação

Conteúdo de Larissa para o repositório, revisado em 14/11/2026. Este arquivo apoia o [roteiro da demonstração](roteiro-demonstracao.md); não é um conjunto de slides.

## Como a NASA acompanha a saúde

O programa [Spaceflight Standard Measures](https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/) combina dados antes, durante e depois do voo: actigrafia (atividade e exposição à luz), autorrelatos de sono, avaliações comportamentais e cognitivas, além de marcadores obtidos de sangue e urina. São medições de pesquisa com instrumentos e procedimentos próprios; não significa medir todos esses itens diariamente. A [página de Standard Measures](https://www.nasa.gov/reference/standard-measures/) descreve ainda amostras e avaliações de funções do organismo.

A exposição à radiação também é investigada com detectores: o [Radi-N2, da CSA](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp), estudou a contribuição dos nêutrons na ISS. Não confundir esse componente com a dose total. O acompanhamento clínico inclui conversas privadas: no [relato da NASA sobre saúde de astronautas](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/astronaut-health/), uma médica descreve conferências médicas semanais.

**Onde o Sentinela entra:** a equipe propõe uma interface local que organiza check-ins, comparação com referências, histórico e explicações. Não substitui sensores, exames, avaliações psicológicas, conferências médicas ou protocolos de agência. Não integra dispositivos nem recebe dados da NASA na versão atual.

## Por que usamos dados simulados

Os três perfis e os 60 dias são gerados por código com semente fixa; nenhum registro foi extraído de astronauta real. Isso permite demonstrar os mesmos casos sem expor informações pessoais.

A [política de compartilhamento de dados humanos da NASA](https://www.nasa.gov/directorates/esdmd/hhp/human-health-and-performance-data-sharing/) prevê solicitação, análise e eventual liberação de dados médicos e de pesquisa. O projeto não identificou uma série pública diária adequada para reproduzir os dez indicadores por indivíduo. Essa constatação da pesquisa não prova que inexista qualquer conjunto público. Na fala, usar “não utilizamos uma série clínica pública adequada”, evitando afirmar inexistência absoluta.

## O que muda entre ambientes

| Ambiente | Gravidade | Comunicação e autonomia | Radiação e evacuação |
| --- | --- | --- | --- |
| Estação em órbita baixa | Microgravidade | Contato próximo à Terra, sujeito a disponibilidade operacional | Proteção parcial da magnetosfera; retorno depende de veículo e operação, sem promessa de resgate imediato |
| Trânsito no espaço profundo | Em viagem sem gravidade artificial, microgravidade | A distância impõe atrasos variáveis; a tripulação precisa de autonomia | Fora da proteção da órbita baixa; opções de retorno dependem da trajetória |
| Superfície lunar | Cerca de 1/6 da gravidade terrestre | Maior distância e restrições de enlace que a órbita baixa | Fora da proteção habitual da órbita baixa; retorno exige infraestrutura e veículo adequados |
| Superfície marciana | Cerca de 0,38 da gravidade terrestre | Minutos por sentido; a resposta completa exige ida, avaliação e volta | Operação distante e sem evacuação rápida para a Terra; proteção depende do habitat e da missão |

Base geral: [cinco perigos do voo espacial, NASA](https://www.nasa.gov/hrp/hazards/). Para Marte, a [análise de comunicação da NASA](https://ntrs.nasa.gov/citations/20220013418) apresenta atraso variável, chegando a cerca de 22 minutos **por sentido**, além de interrupções. Não é tempo de resposta do médico nem um contador implementado pelo app.

A experiência humana de longa duração vem principalmente da órbita baixa. Missões lunares históricas foram curtas; não há experiência humana de superfície em Marte que valide faixas de saúde de longa duração. Estudos de análogos ajudam, mas não equivalem a observações de tripulações nesses destinos. Não extrapolar os números da demonstração como limites seguros para Lua ou Marte.

## O que podemos afirmar na demonstração

- O app registra e compara. Não prevê doença nem calcula probabilidade de adoecimento.
- O pior nível entre faixa geral e desvio pessoal prevalece; o ambiente e o sexo não mudam o nível.
- “Mudaram juntos” descreve coocorrência, sem afirmar causalidade.
- As faixas são demonstrativas e a [revisão documental](pesquisa/revisao-faixas.md) registra sua evidência e limitações. Não foram clinicamente aprovadas.
- “Avisar o solo” é uma marcação local; mensagens também não são enviadas.
- Não há autenticação nesta versão. Para operação real, a identidade deveria ser integrada ao sistema institucional da agência, com autorização e auditoria. Essa é uma proposta de arquitetura futura, não uma integração existente.
- Exportação, solicitação e exclusão são locais; não representam certificação de conformidade com a LGPD.

Não anunciar projeção de tendência como recurso disponível: a decisão D4 permanece pendente. Não dizer que o Sentinela é software oficial, certificado ou usado pela NASA.
