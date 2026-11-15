# Continuidade da Larissa — 15/11/2026

## Integração local das atualizações de Davi — 15/11/2026

Base local: `main` em `755187b`. Após consultar `origin`, foi identificado e integrado o commit de Davi `0d185ad`, com N15 (grade de Amsler, perguntas por olho e opção de pular) e N16 (exercício por sessão e comparação semanal com plano demonstrativo e linha de base). A cadência da visão continua pendente em N18. O merge ocorreu sem conflitos.

Antes da integração, as revisões da Larissa foram preservadas no commit local `1072f49`: N3, N4, N5, N6 e N8, com textos em português/inglês, evidências e documentação. Nenhuma faixa ou nível foi alterado nessa revisão. N10 permanece parcial; apresentação final, roteiro, capturas e slides continuam para o encerramento do escopo.

Validação após integrar Davi: **96 testes em oito arquivos passaram**, build com TypeScript e PWA passou e `git diff --check` sem erros. O build informa pacote principal acima de 500 kB. Não foi executada uma nova verificação de navegador para as interfaces N15/N16; os testes não equivalem a validação clínica. Integração somente local, sem publicar commits no remoto.

O histórico abaixo descreve a branch anterior da Larissa; não substitui este estado integrado na `main` local.

Branch: `feat/larissa-revisao-privacidade-fase-11`.

## Estado atual após integrar Talita até `ec23abd`

Integrados `9466cee` (M4/M7/M9), `6667dba` (M10/M11) e `ec23abd` (tarefas futuras de leitura de aparelhos), preservando as duas revisões anteriores da Larissa. M1–M11 agora têm implementação; isso não significa conclusão do projeto inteiro nem aprovação clínica.

### Entregue sem depender de Davi

- Revisão documental de reação, correlação com sono, metas semanais, origem declarada e destaque de readaptação, com NASA e estudo original de Jones et al. (2022). O app não é equivalente ao RST validado e não diagnostica fadiga. A meta de cinco em sete dias e a antecedência de sete dias para readaptação são demonstrativas.
- M7 documentada como correlação genérica por três registros afastados do esperado, sem regra específica de sono ≤6 h. Nenhum corte clínico foi criado ou alterado.
- Resultado de reação registra modo curto/completo, conclusão, duração decorrida, respostas válidas e antecipações. Sessões curtas/interrompidas e legado sem modo não entram em série, gráfico, linha de base, alertas ou correlações; continuam legíveis na consulta e no JSON. Números antigos não recebem protocolo inventado. O seed preserva os números simulados sem modo; a comparação de reação exige novos testes completos.
- O teste agora encerra ao atingir a duração mesmo sem outra resposta. Menos de três respostas válidas não salva resultado. O preenchimento pode ser pulado.
- Privacidade v6 inclui resultado e metadados de reação e origem declarada, cifrados com o check-in. Não há leitura automática, identificação de aparelho ou gravação de cada toque. Exportação individual conferida.
- Testes ampliados: modo completo interrompido e modo curto de 30 s no navegador, média e metadados no JSON, origem vestível/dosímetro, exclusão de curto da série, associação M7 e limites da janela M11.

### Verificação atual

Build com checagem TypeScript passou; **75 testes em 5 arquivos passaram**; integração no Edge passou com perfil temporário, sem acessar o navegador pessoal; `git diff --check` sem erros. O teste no Edge usou respostas automatizadas: prova o fluxo, não precisão clínica. Nenhuma captura foi regenerada. O servidor de desenvolvimento que Larissa pediu para visualizar foi mantido.

### Pendências preservadas

- Com Davi: cifrar plano de medicação com migração e testes, entregar mensagens pela central e definir quem altera missão/fase. Não foi alterada a arquitetura de segurança nesta etapa.
- Aprovação clínica, requisitos jurídicos/operacionais e avaliação de acessibilidade continuam pendentes; testes não certificam conformidade integral com LGPD.
- Apresentação, revisão final do roteiro, capturas, slides e envio somente após concluir o escopo, conforme Larissa. As mudanças de apresentação vindas da Talita foram preservadas pelo merge; esta revisão não produziu material novo.
- Integração real de aparelhos é futuro; a origem atual é informada pela pessoa. Importação de arquivo de exemplo não foi implementada.

## Histórico: atualização anterior até `097d2fd`

Integrados `8587439` (M8 perfil de missão e M5 estimativa óssea) e `097d2fd` (M6 soma de radiação) por merge, preservando o commit anterior da Larissa `412cb19`. Não houve conflitos. A branch da Talita não foi modificada.

**Estado atual:** M1–M3, M5, M6 e M8 implementadas. M4, M7, M9, M10 e M11 seguem pendentes. A entrega das mensagens continua tarefa conjunta com Davi e não foi implementada nesta revisão. Apresentação, roteiro, capturas e slides continuam reservados à entrega final.

**Tasks concluídas nesta atualização:**

- Revisão documental de M5 com fonte NASA e estudo original de Gabel et al. (2022), diferenciando taxa média de grupo, período de 4–6 meses, simplificação linear e ausência de previsão individual. `context.boneLoss.demo` agora identifica a conta como demonstrativa; fórmula e cortes de alerta preservados.
- Texto de M5 esclarece extrapolação tanto para missões curtas quanto acima de seis meses. O texto do exercício também deixa explícita a população/período da taxa citada.
- Revisão de M6: soma de valores informados, sem conexão com dosímetro ou limite de carreira. Dias ausentes significam registro incompleto, sem quantificar a exposição desconhecida. Valores negativos/não finitos não entram na soma; zero continua válido.
- Privacidade das preferências de missão sem cifra e dos cálculos de tela. Aviso v5: resultados derivados e preferências compartilhadas não integram a cópia individual; as doses diárias continuam no JSON. M4/M10 não são anunciadas como existentes.
- Script ampliado para trocar o perfil pela interface, abrir as regiões óssea e corpo inteiro e conferir o contexto exibido. As verificações anteriores de PIN, check-in, mensagem, pedido de exclusão e JSON foram mantidas.
- Documentos operacionais atualizados; removida a descrição antiga de botão de exclusão do histórico em `docs/como-funciona.md`.

**Verificação desta atualização:** build com TypeScript passou; 69 testes em 5 arquivos passaram; script de integração passou no Edge com perfil temporário; `git diff --check` sem erros. Nenhuma captura foi regenerada.

**Para continuar:** integrar M4/M7/M9/M10/M11 quando existirem e revisar os respectivos dados/regras; coordenar entrega das mensagens com Davi; manter a aprovação clínica e a proteção do plano de medicação como pendências explícitas. A permissão para mudar perfil/fase da missão é responsabilidade da frente de Davi. Apresentação somente após concluir o projeto.

## Registro da primeira entrega (antes desses commits)

Base: `origin/tasks-fase-11-melhorias-desafio`, commit `8911672`, de Talita Santos. A base contém M1–M3; M4–M11 continuam pendentes, apesar de algumas tarefas anteriores terem sido redigidas supondo toda a fase concluída.

## Entregue nesta branch

- Revisão documental de medicação, estresse, carga de trabalho e treino resistido, com fontes NASA e estudos originais. Referências e limites nos documentos e no `rangeEvidence`; nenhum corte ou nível alterado.
- Privacidade atualizada para distinguir plano de medicação sem cifra, valores diários cifrados, metadados abertos e arquivo JSON legível. Aviso `2026-11-15-v4`, que pede nova leitura, preservando o histórico.
- Correção do link da comunicação: a tela Seus dados exporta e registra pedido, sem exclusão imediata. Texto do login também deixa de prometer cifra para todo o cadastro.
- Script de integração adaptado ao login real, check-in M1–M3, pedido de exclusão, download JSON e reset com permissão de oficial médico.
- Lockfile reparado: `npm ci` falhava por ausência de `@emnapi/core` e `@emnapi/runtime` na árvore de dependências opcionais. Nenhuma dependência direta foi acrescentada ou atualizada.
- `TASKS.md` separa os itens concluídos dos que dependem de implementação.

## Evidência de verificação

- `npm.cmd run build`: passou, incluindo a checagem TypeScript e geração do PWA.
- `npm.cmd test`: 59 testes passaram, em 4 arquivos.
- `node scripts/verify-larissa.mjs`: passou no Edge headless/Windows, com perfil temporário e dados fictícios.
- `git diff --check`: sem erros de whitespace na revisão.

O teste de navegador entrou como Lia pela interface, registrou estresse 4, carga 3, 30 min aeróbicos e 20 min resistidos, vitamina marcada e colírio não marcado. O JSON baixado continha exercício total de 50 min e parcela resistida de 20 min, valores legíveis e só registros da Lia. O pedido não removeu os 61 registros dela nem os 60 de Ana ou Kenji. Mensagem ficou como texto e cifrada no banco. Recarregar exigiu novo login e preservou dados/pedido. O oficial médico recriou a demonstração e a leitura do aviso permaneceu.

O script não migra bancos antigos e não cobre M4–M11. Capturas não foram regeneradas. Apresentação, roteiro, recursos NASA para a entrega, slides e envio não foram alterados: Larissa pediu para trabalhar nisso após concluir o escopo e o projeto.

## Para retomar em 16/11

1. Comparar esta branch com a base da Talita e revisar os textos e limites documentados.
2. Integrar as próximas melhorias apenas quando estiverem prontas; completar revisão documental de M4/M5/M7/M9 e privacidade/exportação de M4/M10. Não marcar esses itens como concluídos agora.
3. Combinar com Davi a entrega de mensagens pela central: tarefa compartilhada, ainda não implementada aqui. Requer definir destinatário, acesso, entrega e eventual confirmação; não anunciar envio antes disso.
4. Reavaliar o plano de medicação: hoje há uma marcação por medicamento por dia, mesmo com múltiplos horários. O comportamento foi documentado, sem expandir o escopo para um controle individual de doses.
5. Manter revisão clínica pendente: referências não validam os cortes demonstrativos. Tratar o plano sem cifra como limitação aberta; informar isso não implementa sua criptografia.

Para comparar, usar `git diff origin/tasks-fase-11-melhorias-desafio...feat/larissa-revisao-privacidade-fase-11` (a base pode receber novos commits depois desta entrega; o commit original está registrado acima).
