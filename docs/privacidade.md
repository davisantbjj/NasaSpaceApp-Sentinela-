# Privacidade e comunicação no protótipo

Revisado por Larissa em 15/11/2026 sobre a branch da Talita, com M1–M3 implementadas. Use somente dados fictícios. O protótipo não oferece serviço de saúde nem declaração de conformidade integral com a LGPD.

## Primeira entrada

Antes de criar a demonstração ou liberar o login, o app apresenta finalidade, armazenamento, acesso, retenção e limites da base legal. O botão registra a leitura em `preferences`, no IndexedDB. Isso não identifica uma pessoa nem constitui consentimento genérico. Outro navegador tem sua própria leitura. A recriação da demonstração preserva essa preferência.

O aviso foi atualizado para `2026-11-15-v4`, explicitando o plano de medicação sem cifra. Uma leitura da versão anterior não dispensa a leitura do novo aviso. A atualização do aviso não apaga o histórico.

## Dados armazenados e proteção real

| Conteúdo | Como fica no navegador | Limite |
| --- | --- | --- |
| Cadastro fictício, sexo, início da missão, indicadores acompanhados e plano de medicação (nomes e horários) | Sem cifra, na tabela `crew` | Acesso ao armazenamento permite ler o plano sem PIN. Se ligado a pessoa real, o plano é dado de saúde sensível. Deve ser protegido numa implementação real. |
| Valores do check-in, incluindo marcações de medicação tomada, estresse, carga de trabalho, exercício total e parcela resistida | Cifrados com AES-GCM e chave por tripulante | É autorrelato; a lista de medicação tem uma marcação diária por medicamento, não um registro separado de cada dose/horário. |
| Conteúdo das anotações e texto das mensagens | Cifrados com a chave do tripulante | Identificadores e horários usados para busca ficam abertos. |
| Pacote para o solo e resumo do comandante | Conteúdo selado para cada destinatário | Metadados de fila ficam abertos; o protótipo simula os destinatários no mesmo navegador. |
| Registro de acesso, pedidos de exclusão e preferências | Sem cifra | Também precisam de uma política de proteção e retenção para uso real. |
| Arquivo JSON exportado | Legível e sem cifra fora do banco | O PIN não protege o arquivo baixado. O usuário precisa cuidar das cópias. |

M4 (teste de reação) e M10 (origem do dado) ainda não estão implementadas nesta base. Seus resultados e metadados não são anunciados como coletados ou exportados. Rever este documento e o aviso quando esses dados passarem a existir.

## Seus dados

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

O script usa perfil temporário isolado e downloads fictícios, sem acessar o navegador pessoal. `EDGE_PATH` permite indicar outra instalação do Edge. Verifica aviso atualizado antes do seed, login pela interface, check-in M1–M3, mensagem como texto, pedido idempotente sem exclusão, download JSON legível e restrito ao perfil, cifra dos valores no banco, persistência após recarregar/reautenticar e reset pelo oficial médico preservando o aviso.

Não cobre migração de bancos antigos, todas as permissões, teste de reação ou origem do dado ainda inexistentes. Não substitui revisão clínica, jurídica ou acessibilidade com leitor de tela. `--screenshots` é opcional; as capturas e a apresentação final ficam para depois da conclusão do escopo.

Em 15/11/2026, passaram o build (com checagem de tipos), os 59 testes Vitest e o script acima no Edge. Detalhes e pendências em [continuidade da Larissa](continuidade-larissa-2026-11-15.md).
