# Proposta: monitor de saúde para astronautas (Space Apps 2026)

Nov 13, 2026 · @Afonso

## Resumo

A proposta é um aplicativo web que funciona sem internet, em que o astronauta registra seus indicadores de saúde todo dia, vê num corpo humano clicável como cada sistema está e recebe uma orientação clara sobre o que fazer. O nome provisório é Sentinela.

Três escolhas diferenciam o projeto:

- Cada astronauta é comparado com o próprio padrão dos primeiros dias de missão, e não só com uma média da população.
- Todo alerta explica o motivo, cita a fonte da NASA ou da CSA e sugere uma ação.
- Tudo roda no próprio dispositivo, porque numa missão a Marte a comunicação com a Terra atrasa até 20 minutos em cada sentido.

É um protótipo de apoio à decisão. Não faz diagnóstico médico, e os dados da tripulação são simulados.

## O problema e como a proposta responde

O desafio é "Create Health Monitoring Software for Astronauts on Space Missions", de nível intermediário. Em missões longas, o astronauta precisa perceber sozinho as mudanças na própria saúde, e o enunciado pede uma ferramenta visual que reúna indicadores, ajude a avaliar e oriente a ação.

O enunciado propõe cinco perguntas. A tabela mostra onde cada uma é respondida no aplicativo.

| Pergunta do enunciado | Resposta no Sentinela |
| --- | --- |
| Quais medidas dá para fazer no espaço? | Só indicadores que já são medidos na estação espacial ou em estudos da NASA: sinais vitais, sono, exercício, humor, dose de radiação e sintomas |
| Por que o exame é necessário? | Cada indicador tem um cartão "por que medir", ligado a um dos 17 riscos da NASA |
| Como os perigos afetam o indicador? | O cartão mostra qual dos 5 perigos pesa sobre ele e o que se sabe, com números reais |
| Quando o resultado pede atenção? | Três níveis por cor: verde (normal), amarelo (acompanhar e avisar a tripulação) e vermelho (acionar o médico de bordo e o solo) |
| Que ações evitam o quadro crítico? | Cada alerta traz uma contramedida tirada do material da NASA, como exercício, hidratação, ajuste de luz ou descanso |

As sugestões opcionais do enunciado também entram: lembretes de medição na rotina, gráficos ao longo do tempo, cores, instruções simples, gamificação leve e modos de ambiente (nave, estação, base lunar ou marciana).

## Indicadores e faixas de alerta

São dez indicadores: os seis que o enunciado cita e quatro que o material da NASA e da CSA justifica. As faixas abaixo são valores de demonstração, baseados em referências clínicas gerais para adultos em repouso, e precisam de revisão antes da entrega.

| Indicador | Entrada | Verde (demonstração) | Risco da NASA ligado | Ação sugerida no alerta |
| --- | --- | --- | --- | --- |
| Pressão arterial | Digitada (mmHg) | Perto de 120/80; alerta se cair muito | Adaptações cardiovasculares | Hidratação, roupa de compressão antes do pouso |
| Frequência cardíaca | Digitada (bpm) | 60 a 100 em repouso | Adaptações cardiovasculares | Repetir a medida, descansar, avisar o médico de bordo |
| Glicemia | Digitada (mg/dL) | 70 a 99 em jejum | Alimentação e nutrição | Rever a refeição, medir de novo |
| Temperatura | Digitada (°C) | 36,1 a 37,2 | Resposta imunológica | Observar sintomas, isolar se houver febre |
| Sono | Horas por dia | 7 a 9 horas | Sono e horários irregulares | Ajustar luz, reduzir cafeína, proteger o horário de descanso |
| Humor | Escala de 1 a 5 com rostos | 4 ou 5 | Mudanças comportamentais | Diário, contato com a família, cuidar da horta de bordo |
| Exercício | Minutos por dia | Cerca de 90 minutos, 6 a 7 dias por semana | Condicionamento e ossos | Repor a sessão, priorizar treino resistido |
| Radiação | Dose do dia (microsieverts) | Perto do habitual da missão | Câncer por radiação | Ir para a área mais protegida, como o alojamento |
| Visão | Autoteste rápido e sintomas | Sem mudança | SANS (olho e cérebro) | Registrar, agendar exame ocular |
| Sintomas | Lista de marcar | Nenhum | Vários | Depende do sintoma |

Duas regras valem para todos os indicadores:

- Padrão pessoal. Os primeiros 7 dias de registro formam a linha de base do astronauta. Um desvio mantido por 3 dias vira amarelo, mesmo dentro da faixa geral.
- Contexto real em cada cartão. Exemplos tirados das fontes: os ossos perdem de 1% a 1,5% de densidade por mês; cerca de 70% dos astronautas da estação têm inchaço no fundo do olho; a tripulação vê uns 16 nasceres do sol por dia; a dose de nêutrons na estação é de cerca de 150 microsieverts por dia.

## Funcionalidades e telas

São cinco telas. As três primeiras formam o mínimo para a entrega; as outras duas entram se sobrar tempo.

| Tela | O que mostra | Prioridade |
| --- | --- | --- |
| Painel com corpo humano | Figura em que cada região (cabeça e olhos, coração, ossos e músculos, sistema imune, mente) tem a cor do pior indicador ligado a ela. Clicar abre a função, o estado e os alertas da região | Essencial |
| Check-in diário | Formulário guiado, um indicador por passo, com instrução de como medir e por que medir | Essencial |
| Alertas e ações | Lista por gravidade. Cada alerta diz o que mudou, por que importa, o que fazer e quando avisar o solo | Essencial |
| Tendências | Gráfico de cada indicador ao longo da missão, com a linha de base pessoal marcada | Desejável |
| Missão e rotina | Escolha do ambiente (estação, trânsito, Lua, Marte), lembretes de medição e sequência de dias com check-in completo | Desejável |

O modo de ambiente muda o contexto dos alertas. Em trânsito para Marte, por exemplo, o aviso de radiação pesa mais e a mensagem lembra que a resposta do solo demora.

A gamificação fica simples: sequência de dias com check-in e metas semanais de sono e exercício. Para a demonstração, o app já vem com três tripulantes fictícios e cerca de 60 dias de dados simulados, incluindo um caso que vai de verde a vermelho.

## Arquitetura e tecnologias

O aplicativo roda inteiro no navegador, sem servidor. Isso combina com o cenário (sem depender da Terra) e reduz o que pode dar errado em 48 horas.

| Camada | Tecnologia sugerida | Papel |
| --- | --- | --- |
| Interface | React com TypeScript e Vite | Telas, navegação e estado |
| Corpo humano | SVG com regiões clicáveis | Mapa visual do estado de cada sistema |
| Gráficos | Recharts | Tendências e linha de base |
| Dados | IndexedDB no próprio dispositivo | Registros diários, sem internet |
| Regras | Módulo em TypeScript e um arquivo JSON de regras | Faixas, linha de base, níveis de alerta e textos de ação |
| Uso offline | PWA com service worker | Abre e funciona sem conexão |
| Publicação | Vercel ou GitHub Pages | Link público para os jurados |

O fluxo é curto: o check-in grava o registro, o módulo de regras compara com a faixa geral e com a linha de base pessoal, e o resultado alimenta o painel, os alertas e os gráficos.

Manter as regras num arquivo JSON separado tem duas vantagens. Qualquer pessoa da equipe ajusta faixas e textos sem mexer no código, e cada regra carrega o link da fonte que a justifica.

Se a equipe quiser ir além, a extensão natural é um resumo diário compacto para enviar ao solo quando houver janela de comunicação. Fica fora do mínimo.

## Plano para as 48 horas

O hackathon acontece em 14 e 15 de novembro de 2026. A ordem abaixo garante algo demonstrável já no fim do primeiro dia.

| Bloco | Entrega |
| --- | --- |
| Sábado de manhã | Projeto criado e publicado com link, modelo de dados, arquivo de regras com os dez indicadores, dados simulados |
| Sábado à tarde | Check-in diário gravando no dispositivo e módulo de regras devolvendo verde, amarelo ou vermelho |
| Sábado à noite | Painel com o corpo humano clicável e tela de alertas com ações |
| Domingo de manhã | Gráficos de tendência, linha de base pessoal, modo de ambiente |
| Domingo à tarde | Lembretes e sequência de dias, revisão dos textos e das fontes, teste sem internet |
| Domingo, últimas horas | Demonstração gravada, texto da página do projeto e envio |

Se a equipe tiver mais de uma pessoa, a divisão que menos gera espera é: uma na interface e no corpo humano, uma nas regras e nos dados, uma nos textos, nas fontes e na apresentação.

Roteiro da demonstração, em cerca de um minuto: o painel todo verde, um check-in com sono ruim por três dias, a região da mente ficando amarela, o alerta explicando o motivo com a fonte, e a ação sugerida.

Pontos a confirmar antes de começar:

- [ ] Formato exigido para o envio (vídeo, slides, repositório), no guia do participante
- [ ] Tamanho da equipe e quem faz o quê
- [ ] Se entraram recursos novos na aba Resources do desafio

## Limites e riscos

- As faixas de alerta são de demonstração. As fontes do desafio não trazem limites clínicos por indicador, então os valores vêm de referências gerais e são aproximados. Isso precisa aparecer no app e na apresentação.
- O app não é um dispositivo médico. Ele apoia a decisão e indica quando chamar o médico de bordo ou o solo.
- Os dados da tripulação são simulados. Nenhuma das fontes oficiais oferece dados individuais de astronautas.
- Várias equipes estão fazendo painéis de sinais vitais para este mesmo desafio. O que distingue esta proposta é o corpo clicável, a linha de base pessoal e a fonte em cada alerta, e é nisso que o tempo deve ir.
- O maior risco de prazo é o desenho do corpo em SVG. Se atrasar, uma grade de cartões por sistema do corpo cumpre o mesmo papel.

## Fontes

Desafio:

- [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=details)

Recursos oficiais listados no desafio:

- [5 Hazards of Human Spaceflight (NASA)](https://www.nasa.gov/hrp/hazards/)
- [Risks of Human Spaceflight (NASA)](https://www.nasa.gov/hrp/risks/)
- [Ongoing HRP Research in Space (NASA)](https://www.nasa.gov/hrp/ongoing-hrp-research/)
- [Monitoring radiation for astronaut health (CSA)](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)
- [Why do we conduct science experiments in space? (CSA)](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)

Páginas internas de onde saíram os números citados:

- [Hazard: Distance from Earth](https://www.nasa.gov/hrp/hazard-distance-from-earth/) (atraso de 20 minutos)
- [Risk of Spaceflight-Induced Bone Changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/) (perda óssea)
- [Risk of SANS](https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/) (70% com inchaço no olho)
- [Risk from Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) (16 nasceres do sol)
- [Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness](https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/) (rotina de exercício)
- [Radi-N2 (CSA)](https://www.asc-csa.gc.ca/eng/sciences/radi-n2.asp) (150 microsieverts por dia)
