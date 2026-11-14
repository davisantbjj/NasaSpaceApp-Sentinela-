# Roteiro de demonstração do Sentinela

Responsável pelo conteúdo: Larissa. Duração sugerida: 6 a 8 minutos. Escopo desta entrega: roteiro e conteúdo no Git; sem slides, vídeo ou submissão ao Space Apps.

## Preparação

1. Rodar `npm run dev` ou usar um build previamente validado. Não depender de fontes externas abertas durante a fala.
2. Usar exclusivamente dados fictícios. Na primeira entrada, ler o aviso e abrir a demonstração.
3. Se precisar repetir os casos, usar “Recriar dados de demonstração”, em Missão. Isso apaga check-ins, mensagens e pedidos locais dos três perfis; fazer apenas no navegador reservado à apresentação.
4. Confirmar Ana selecionada e ambiente Estação. Os 60 dias terminam ontem, deixando o check-in de hoje pendente.
5. Conferir os casos: Ana com dois amarelos (sono e humor) e coocorrência de quatro dias; Lia com visão e sintomas amarelos; Kenji sem alertas. Se não corresponder, recriar a demonstração antes da apresentação.

## Fala e ações

| Tempo aproximado | Ação na tela | Fala sugerida |
| --- | --- | --- |
| 0:00–0:45 | Abrir o painel de Ana | “O Sentinela organiza indicadores de saúde para apoiar a decisão em missões longas. É um protótipo local, sem diagnóstico, com perfis simulados e faixas de demonstração.” |
| 0:45–1:15 | Mostrar corpo e última data | “Cada região reúne indicadores. O painel usa o último registro e informa que o check-in de hoje está pendente. Cor, texto e ícone comunicam o nível.” |
| 1:15–2:00 | Selecionar Mente e sono; abrir Alertas | “Ana teve queda do sono e do humor. Cada alerta explica o que mudou, a referência, a relevância, a ação, a confiança e a fonte. Vale o pior nível entre faixa geral e padrão pessoal.” |
| 2:00–2:30 | Mostrar “Mudaram juntos” | “Os indicadores se afastaram do esperado nos mesmos registros. Não estamos afirmando que um causou o outro.” |
| 2:30–3:10 | Tendências → Sono, 14 dias | “Esta linha mostra registros passados, a faixa geral e o padrão pessoal. O aplicativo mede e compara; não prevê doença.” |
| 3:10–3:50 | Missão → Marte; retornar aos alertas | “A distância muda a operação: em Marte o sinal pode levar minutos por sentido. Mudar o ambiente não altera o nível. Hoje, só alertas de radiação têm nota específica por ambiente; os alertas de sono e humor da Ana não ganham esse texto.” |
| 3:50–4:35 | Selecionar Kenji → Check-in; pular até Sintomas; marcar Dor no peito; revisar e salvar | “Para demonstrar o vermelho, registramos um sintoma fictício. O motor prioriza atenção imediata e marca aviso ao solo. Nada é enviado: a conduta depende da equipe de bordo.” |
| 4:35–5:10 | Em Alertas, abrir comunicação por texto; escrever “Exemplo fictício: preciso mostrar uma mensagem à equipe”; salvar | “Quem não puder falar pode escrever e mostrar a tela. A mensagem está salva localmente e não enviada. Não existe atendimento ou resposta médica por este app.” |
| 5:10–6:00 | Missão → Seus dados; exportar JSON e registrar pedido de exclusão | “Explicamos o que fica no navegador e quem pode acessar. Esta cópia contém só o perfil selecionado. O pedido de exclusão fica local; não foi enviado nem executado. A exclusão imediata é outra ação, com confirmação.” |
| 6:00–6:45 | Voltar à Missão e à nota de readaptação; opcionalmente selecionar Ana | “Existe um contexto educativo de readaptação por sexo, sem mudar as faixas. Num produto real, identidade e autorização seriam integradas à agência. Hoje qualquer pessoa neste navegador pode trocar o perfil.” |
| 6:45–7:30 | Encerrar no painel | “A NASA acompanha a saúde com instrumentos, exames e conferências médicas. O Sentinela propõe organizar parte desse acompanhamento. Ainda precisamos de validação clínica, controles de acesso e integração operacional.” |

## Se quiser demonstrar exclusão

Fazer por último, no perfil do Kenji, depois de exportar: em Seus dados, abrir a confirmação, conferir o nome e excluir. O painel deve mostrar “Sem registros para avaliar”. Recarregar: o histórico deve continuar vazio; os outros perfis permanecem. Não dizer “tudo normal” quando não há registros. A demonstração pode ser recriada depois, fora da fala principal.

## Explicações para perguntas

**Como a NASA mede?** Actigrafia, autorrelatos e avaliações, amostras de sangue e urina, dosimetria e acompanhamento médico privado. São práticas distintas; o app não reproduz esses instrumentos. Fontes e limites em [apresentacao.md](apresentacao.md).

**Por que simular?** Para repetir os casos e preservar privacidade. Não utilizamos uma série clínica pública adequada aos dez indicadores; dados humanos da NASA têm política de acesso e liberação. Não afirmar que nenhum dado público existe.

**E Lua e Marte?** Mudam gravidade, comunicação, exposição e opções de evacuação. Há pouca experiência humana de longa duração na Lua e nenhuma de superfície em Marte. As faixas do app não validam segurança nesses ambientes.

**As faixas estão aprovadas?** Não. A revisão documental distingue referência geral e escolha de demonstração. Aprovação clínica continua pendente.

**Está em conformidade com a LGPD?** Esta entrega demonstra transparência e ações locais; não certifica conformidade. A tutela da saúde tem condições legais e não é presumida para o hackathon.

## Alternativa em caso de problema

Se a gravação falhar, não repetir a ação como se tivesse funcionado: mostrar o aviso e continuar com o histórico já carregado. Se um caso já tiver sido alterado, usar outro perfil para explicar a diferença ou recriar os dados antes de recomeçar. Não mostrar dados pessoais reais nem prometer entrega de mensagens. Publicação e teste offline completo seguem nas tarefas gerais da equipe.
