# Sentinela: contexto para assistentes de IA

Leia este arquivo primeiro. Ele resume o projeto e aponta para os outros arquivos de contexto.

## O que é

Sentinela é um aplicativo web de monitoramento de saúde para astronautas em missões longas. Foi feito para o NASA Space Apps Challenge 2026, desafio "Create Health Monitoring Software for Astronauts on Space Missions".

O astronauta registra indicadores de saúde todo dia, vê o estado de cada sistema do corpo numa figura humana clicável e recebe orientação sobre o que fazer.

É um protótipo de apoio à decisão. Não faz diagnóstico médico. Os dados da tripulação são simulados.

## Decisões que não mudam

1. O app roda inteiro no navegador e funciona sem internet da Terra. "Offline" quer dizer sem a Terra, não sem rede: a nave tem rede interna e uma central de bordo (simulada no navegador).
2. Os dados ficam no dispositivo (IndexedDB), cifrados com AES-GCM, com uma chave por tripulante (decisão 12). O único servidor é um backend na Terra que só guarda e sincroniza pacotes cifrados; a nave nunca depende dele.
3. As regras de alerta ficam em `src/rules/rules.json`, fora do código. Nenhuma faixa numérica fica escrita dentro de componente.
4. Cada indicador é comparado com duas referências: a faixa geral e a linha de base pessoal do astronauta. O nível final é sempre o pior dos dois, então a linha de base nunca deixa verde um valor fora da faixa geral.
5. Todo alerta tem seis partes: o que mudou, em relação a qual referência, por que importa, o que fazer, a confiança do dado e a fonte.
6. Só existem três níveis: `green`, `yellow` e `red`.
7. O ambiente da missão (estação, trânsito, Lua, Marte) muda a explicação do alerta, nunca o nível. Não existem faixas diferentes por ambiente. Com um perfil de missão (`src/content/missions.ts`), a fase de hoje define o ambiente; trocar à mão continua possível.
8. Cada tripulante tem a sua lista de indicadores acompanhados. Nem todo mundo mede glicemia todo dia.
9. Textos da interface em português. Nomes de código (variáveis, arquivos, tipos) em inglês.
10. Papéis: tripulante vê só os próprios dados; comandante é tripulante e, dos outros, vê só se o check-in de hoje foi feito e se há alerta vermelho (nada clínico); oficial médico de bordo vê todos; médico do solo vê só os pacotes que chegaram à Terra. Abrir dados de outra pessoa fica no registro de acesso dela.
11. A sincronização é automática, nunca uma opção do usuário. Alerta vermelho passa na frente da fila para a Terra. O alerta nunca espera a Terra.
12. Cada tripulante tem a própria chave de dados, aberta só pelo PIN do dono e pelo do oficial médico. O pacote para a Terra é selado para o solo e o resumo do comandante é selado para o comandante, na hora do check-in (`src/sync/compose.ts`); a central só move caixas seladas. Limites do protótipo, que não podem ser escondidos na apresentação: o PIN curto (4 a 6 dígitos) pode ser descoberto testando todas as combinações por quem copiar o banco; e, como tudo roda num navegador só, a chave privada do solo fica no mesmo aparelho, cifrada no PIN do solo.
13. O app serve para qualquer nave. Textos, perfis e explicações descrevem o tipo de missão ou de atividade; uma nave ou um aparelho específico aparece só como exemplo.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | React 18, TypeScript, Vite |
| Rotas | React Router |
| Estado | Zustand |
| Dados locais | IndexedDB via Dexie |
| Gráficos | Recharts |
| Corpo humano | Imagem em `public/body/corpo.webp` com regiões SVG clicáveis por cima (`src/components/body/`) |
| Offline | vite-plugin-pwa |
| Testes | Vitest (só no motor de regras) |
| Publicação | Vercel ou GitHub Pages |

## Onde está cada coisa

| Arquivo | Conteúdo |
| --- | --- |
| `docs/como-funciona.md` | Explicação completa do funcionamento: medições, linha de base, comparação, níveis, alertas e demonstração. Atualize se as regras mudarem |
| `TASKS.md` | Tarefas feitas e pendentes. Atualize ao concluir uma tarefa |
| `docs/estrutura-do-projeto.md` | Árvore de pastas e o papel de cada arquivo |
| `docs/arquitetura.md` | Camadas, tipos de dados, motor de regras, convenções |
| `docs/diagramas/01-visao-geral.md` | Componentes e como se ligam |
| `docs/diagramas/02-fluxo-checkin.md` | Sequência do check-in diário até o alerta |
| `docs/diagramas/03-modelo-de-dados.md` | Entidades e relações |
| `docs/diagramas/04-niveis-de-alerta.md` | Como um indicador muda de verde para amarelo e vermelho |
| `docs/diagramas/05-navegacao-telas.md` | Telas e caminhos entre elas |
| `docs/diagramas/06-sincronizacao.md` | Do check-in até a Terra, com queda de conexão |
| `docs/pesquisa/` | Pesquisa e proposta originais, de onde saem os números e as fontes |
| `docs/pesquisa/riscos-nasa-links-completo.md` | As 17 páginas de risco da NASA, as fichas do Human Research Roadmap, o Human System Risk Board e os artigos linkados. Comece pela tabela "O que mais importa para o Sentinela" |

## Os quinze indicadores

| Id | Indicador | Unidade | Região do corpo |
| --- | --- | --- | --- |
| `bloodPressure` | Pressão arterial | mmHg (sistólica/diastólica) | `heart` |
| `heartRate` | Frequência cardíaca | bpm | `heart` |
| `glucose` | Glicemia | mg/dL | `metabolism` |
| `temperature` | Temperatura | °C | `immune` |
| `sleepHours` | Sono | horas por dia | `mind` |
| `mood` | Humor | escala de 1 a 5 | `mind` |
| `stress` | Estresse | escala de 1 a 5 (5 = muito alto) | `mind` |
| `workload` | Carga de trabalho | escala de 1 a 5 (5 = excessiva) | `mind` |
| `reactionTime` | Tempo de reação | ms, média do teste de reação do app | `mind` |
| `exerciseMinutes` | Exercício | minutos por dia (total: aeróbico + resistido) | `musculoskeletal` |
| `resistanceMinutes` | Treino resistido | minutos por dia, digitados no passo de exercício | `musculoskeletal` |
| `radiationDose` | Radiação | microsieverts por dia | `wholeBody` |
| `vision` | Visão | autoteste (0 = sem mudança, 1 = leve, 2 = clara) | `head` |
| `medication` | Medicação | lista das doses previstas no dia, marcadas como tomadas ou não | `wholeBody` |
| `symptoms` | Sintomas | lista de marcar | `wholeBody` |

## Regras para quem for gerar código

### Entrega de Larissa (14/11/2026), integrada aos papéis e à criptografia

- Aviso de privacidade versionado antes de tudo, inclusive antes do login. Leitura guardada em `preferences`, sem alegar consentimento para saúde ou base legal automática.
- Rotas `/your-data` e `/medical-contact`, acessíveis pelo menu do avatar, por Missão e pelo rodapé (só para tripulantes que entraram); comunicação também por Alertas. Não alteram as entradas da barra principal.
- "Seus dados" vale só para os dados de quem entrou (nunca os do tripulante que o oficial médico está vendo): exportação JSON legível (registros, anotações, mensagens, registro de acesso, pedido) e pedido de exclusão local. **O tripulante não exclui o próprio histórico de saúde**: ele é registro da missão, e o pedido fica para a equipe avaliar (LGPD, art. 18).
- Banco v6 acrescenta `preferences`, `medicalMessages` (texto cifrado) e `deletionRequests`. Reset da demonstração apaga mensagens e pedidos de todos, mas preserva a leitura do aviso.
- Mensagens são salvas para mostrar a tela à equipe, **não enviadas** ao oficial médico. A entrega pela central é uma tarefa futura.
- `src/content/crewContext.ts` mostra contexto por sexo em Missão, sem entrar no motor nem mudar nível. `rangeEvidence` no JSON documenta a origem e limites de verde/amarelo/vermelho. Todos os cortes permanecem demonstrativos; revisão documental não é aprovação clínica.
- Conteúdo e roteiro: `docs/apresentacao.md`, `docs/roteiro-demonstracao.md`, `docs/pesquisa/revisao-faixas.md` e `docs/privacidade.md`.

### Convenções de implementação

- O backend na Terra só guarda e devolve pacotes cifrados. Não coloque regra de alerta nem dado aberto nele.
- Componentes não leem nem gravam dado de saúde sem passar pelos repositórios, que cifram e decifram.
- Não escreva faixas clínicas no código. Leia de `rules.json`.
- Não invente números de saúde. As faixas atuais são de demonstração e estão marcadas com `"demo": true`.
- Não crie regra que mude o nível por ambiente da missão.
- O valor de cerca de 150 microsieverts por dia (Radi-N2) é só de nêutrons, medido na estação espacial. Use como contexto em texto, nunca como faixa de alerta.
- Correlações entre indicadores são mostradas como "mudaram juntos". Nunca escreva que um causou o outro.
- O motor de regras (`src/rules/engine.ts`) é feito de funções puras, sem acesso a banco nem a React.
- Componentes não acessam o Dexie direto. Passam pelos repositórios em `src/data/`.
- Toda tela que mostra nível de alerta usa cor e também texto ou ícone. A cor nunca é o único sinal.
- Mantenha o aviso "protótipo, não é dispositivo médico" visível no rodapé.

## Fontes oficiais do desafio

- https://www.nasa.gov/hrp/hazards/
- https://www.nasa.gov/hrp/risks/
- https://www.nasa.gov/hrp/ongoing-hrp-research/
- https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
