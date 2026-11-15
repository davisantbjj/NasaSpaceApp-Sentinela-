# Privacidade e comunicação no protótipo

Revisado por Larissa em 15/11/2026 até a base integrada `2769fb5`, incluindo os novos dados da fase 12. Use somente dados fictícios. O protótipo não oferece serviço de saúde nem declaração de conformidade integral com a LGPD.

## Primeira entrada

Antes de criar a demonstração ou liberar o login, o app apresenta finalidade, armazenamento, acesso, retenção e limites da base legal. O botão registra a leitura em `preferences`, no IndexedDB. Isso não identifica uma pessoa nem constitui consentimento genérico. Outro navegador tem sua própria leitura. A recriação da demonstração preserva essa preferência.

O aviso foi atualizado para `2026-11-15-v7`, incluindo os novos dados da fase 12 e as referências de massa/dose anterior guardadas sem cifra. Uma leitura da versão anterior não dispensa a leitura do novo aviso. A atualização do aviso não apaga o histórico.

## Dados armazenados e proteção real

| Conteúdo | Como fica no navegador | Limite |
| --- | --- | --- |
| Cadastro fictício, sexo, início da missão, indicadores acompanhados e plano de medicação (nomes e horários) | Sem cifra, na tabela `crew` | Acesso ao armazenamento permite ler o plano sem PIN. Se ligado a pessoa real, o plano é dado de saúde sensível. Deve ser protegido numa implementação real. |
| Valores do check-in, incluindo marcações de medicação tomada, estresse, carga de trabalho, exercício total e parcela resistida | Cifrados com AES-GCM e chave por tripulante | É autorrelato; a lista de medicação tem uma marcação diária por medicamento, não um registro separado de cada dose/horário. |
| Conteúdo das anotações e texto das mensagens | Cifrados com a chave do tripulante | Identificadores e horários usados para busca ficam abertos. |
| Pacote para o solo e resumo do comandante | Conteúdo selado para cada destinatário | Metadados de fila ficam abertos; o protótipo simula os destinatários no mesmo navegador. |
| Registro de acesso, pedidos de exclusão e preferências | Sem cifra | Também precisam de uma política de proteção e retenção para uso real. |
| Arquivo JSON exportado | Legível e sem cifra fora do banco | O PIN não protege o arquivo baixado. O usuário precisa cuidar das cópias. |
| Perfil de missão e substituição manual do ambiente (M8) | Preferências compartilhadas em `settings`, sem cifra | Qualquer perfil de bordo pode alterar pela interface atual; a definição de permissões continua com Davi. Não integram a cópia individual. |
| Estimativa óssea e soma/percentual de radiação (M5–M6/N2) | Calculados em tela, sem nova tabela | Não são novas medições. O JSON contém doses diárias, início da missão e dose anterior informada no cadastro, mas não exporta essas contas nem um histórico real das fases. |

## Reação, origem e cálculos novos

M4 guarda `reactionTime` (média em ms) e `reactionTest` (modo curto/completo, conclusão, duração decorrida, quantidade de respostas válidas e antecipações). Esses campos estão dentro de `DailyValues`: ficam cifrados com o registro e aparecem legíveis na exportação individual, nos mesmos limites de acesso já existentes. Toques individuais e seus horários não são persistidos. Se houver menos de três respostas válidas ou o passo for pulado, não há resultado salvo. Curto/interrompido não entra na comparação pessoal; registros anteriores sem modo são mantidos sem presumir protocolo.

M10 guarda `values.sources`, também cifrado e exportado: origem declarada como sensor vestível ou dosímetro. Ausente/manual significa valor digitado, sem confirmar o método usado em registros antigos. O app não obtém identificador, pareamento, autorização Bluetooth ou leitura contínua do aparelho. Todos os valores são copiados pela pessoa ou simulados no seed; a origem não é prova de precisão.

Metas semanais, associação entre sono e reação e aviso de readaptação são derivados, sem nova tabela. Não integram o JSON como diagnósticos; seus valores de origem são exportados quando registrados. Preferências de missão continuam compartilhadas e fora da cópia individual. A migração v11 acrescenta o acompanhamento da reação aos cadastros, sem inventar resultados passados. Não há nova categoria de destinatário ou envio criada por esta revisão.

## Seus dados

### Novos campos da fase 12: fluxo conferido no código

- Dentro de `DailyValues`, massa diária, refeições, água, qualidade do sono, respostas da Amsler por olho (incluindo as áreas tocadas na grade), sessão de exercício (incluindo aparelhos usados e minutos em cada um) e avaliação de condicionamento ficam cifrados com o check-in. `asNeeded` e `sleepAid` são copiados nas marcações de medicação. O exportador inclui os registros abertos pelos repositórios: esses campos aparecem no JSON quando presentes, sem uma lista de campos novos a filtrar.
- `startBodyMassKg` e `priorCareerDoseMsv` ficam no cadastro `crew` **sem cifra** e são incluídos na cópia individual. Na interface atual, só o oficial médico pode editá-los; essa restrição de interface não cifra o armazenamento. Dose anterior ausente não comprova exposição zero.
- `cabinCo2Mmhg` fica em `settings`, compartilhado e sem cifra; não integra a cópia individual. O app não grava série de amostras, sensor ou hora da leitura de CO₂. Não é um monitor ambiental contínuo.
- Os valores diários entram em `PacketPayload.values`, selados para o solo, sob o fluxo atual de sincronização; isso não garante que cada campo já tenha uma apresentação específica na tela do solo. O comandante não recebe os valores clínicos de colegas. Não foi criado outro destinatário.
- Migrações v12–v14 acrescentam referências fictícias e indicadores aos cadastros, sem preencher retroativamente valores diários antigos. A v14 concilia as migrações feitas em paralelo. Não há nova tabela de leituras contínuas.

Esta é uma conferência estática de tipos, repositórios, migrações e composição de pacotes; não representa um novo teste de navegador, migração de bancos antigos ou validação jurídica. O script histórico abaixo não cobre integralmente os campos da fase 12.

A rota `/#/your-data`, acessível no menu, no rodapé e em Missão, opera sobre o perfil de quem entrou, inclusive quando o oficial médico está consultando outro tripulante:

- Exportação JSON: cadastro com plano de medicação, check-ins, anotações, mensagens, registro de acesso referente ao titular e pedido de exclusão. Não inclui outros perfis ou preferências compartilhadas. Alertas e linha de base são derivados e não integram a cópia. Não existe importação nem portabilidade regulamentada.
- Nos check-ins, `exerciseMinutes` é o total de aeróbico mais resistido; `resistanceMinutes` é a parcela resistida. Não somar os dois novamente. `medication` contém identificador, nome e marcação de tomada. Campos pulados podem estar ausentes; dias antigos não ganham valores retrospectivos nas migrações M1–M3.
- Pedido de exclusão: protocolo local pendente, sem envio ou prazo prometido. Repetir mantém o mesmo pedido. Nenhum dado é apagado.
- O tripulante não dispõe de botão para apagar o próprio histórico. Essa decisão de funcionamento da demonstração não significa que a LGPD proíba a eliminação ou que haja autorização legal para retenção indefinida em um serviço real.

“Recriar dados de demonstração” é uma ação separada, restrita pela interface ao oficial médico. Apaga e recria dados simulados e chaves de todos os perfis locais, inclusive mensagens, pedidos e acessos. Preserva a leitura do aviso. Não remove arquivos exportados ou dados que já tenham chegado ao backend na Terra. O navegador também pode remover o armazenamento; não há recuperação entre aparelhos implementada.

## Comunicação por texto

A rota `/#/medical-contact` permite escrever de 1 a 2.000 caracteres e salvar para mostrar a tela ao oficial médico. Há histórico por perfil e indicação de mensagem local, não enviada. O React apresenta o texto sem interpretá-lo como HTML. A exportação e o pedido de exclusão ficam em Seus dados; não há exclusão imediata de mensagens nessa tela.

Não há entrega, notificação, confirmação de leitura ou resposta médica. Papéis e central já existem, mas a integração da mensagem ainda é tarefa conjunta com Davi. Em urgência, a interface orienta acionar a equipe pelo meio disponível.

## Acesso e retenção

Os valores cifrados de um tripulante abrem com as chaves protegidas pelo PIN do dono e do oficial médico. O comandante recebe somente check-in feito/pendente e alerta vermelho sim/não; o solo abre pacotes entregues. Consultas de outros papéis são registradas. O PIN curto (4–6 dígitos) pode ser descoberto por quem copiar o banco. A chave privada do solo fica neste mesmo navegador, protegida pelo PIN do solo, porque a demonstração usa um único aparelho.

Os dados locais permanecem até limpeza/remoção do armazenamento ou recriação da demonstração. Não há política de retenção institucional ou fluxo de atendimento ao pedido implementados. O backend, quando configurado, recebe pacotes cifrados. Abrir fontes externas e baixar cópias são ações separadas do usuário.

## Enquadramento jurídico a validar para uso real

A [LGPD, texto atualizado da Câmara](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html), inclui dados referentes à saúde vinculados a pessoa natural entre os dados sensíveis (art. 5º, II). O plano de medicação exige essa atenção mesmo estando no cadastro, fora dos valores cifrados.

A tutela da saúde do art. 11, II, f depende de procedimento realizado por profissional de saúde, serviço de saúde ou autoridade sanitária. O demonstrador não presume essa condição. O art. 18 prevê direitos cuja aplicação depende da hipótese legal; exportar JSON e registrar pedido local não esgotam essas obrigações. Consulta documental em 15/11/2026; não substitui avaliação jurídica do uso real.

Antes de dados reais, definir controlador, contato e base legal; validar segurança, retenção, atendimento a direitos e destino de cópias. PIN, papéis e cifra já existem como controles do protótipo, mas não representam autenticação institucional ou conformidade integral.

## Verificação reproduzível

Com Node com `WebSocket` global e Edge instalado no Windows:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
# Em outro terminal:
node scripts/verify-larissa.mjs
```

O script usa perfil temporário isolado e downloads fictícios, sem acessar o navegador pessoal. `EDGE_PATH` permite indicar outra instalação do Edge. Verifica aviso atualizado antes do seed, login pela interface, escolha de perfil de missão e contexto M5–M6, check-in M1–M3, mensagem como texto, pedido idempotente sem exclusão, download JSON legível e restrito ao perfil, cifra dos valores no banco, persistência após recarregar/reautenticar e reset pelo oficial médico preservando o aviso.

O script também executa um teste completo interrompido e um teste curto de 30 s com respostas automatizadas, e verifica resultado, metadados e origem no JSON. Isso verifica o fluxo, não precisão de tempo ou equivalência ao protocolo NASA. Não cobre migração de bancos antigos, todas as permissões ou ciclo de envio ao solo. Não substitui revisão clínica, jurídica ou acessibilidade com leitor de tela. `--screenshots` é opcional; as capturas e a apresentação final ficam para depois da conclusão do escopo.

Em 15/11/2026, após integrar M1–M11 e revisar M4/M7/M9/M10/M11, passaram o build (com checagem de tipos), os 75 testes Vitest e o script acima no Edge. Detalhes e pendências em [continuidade da Larissa](continuidade-larissa-2026-11-15.md).
