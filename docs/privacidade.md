# Privacidade e comunicação no protótipo

Implementação local de Larissa, 14/11/2026. Use somente dados fictícios. O protótipo não oferece serviço de saúde nem declaração de conformidade integral com a LGPD.

## Primeira entrada

Antes de criar a demonstração ou liberar formulários, o app apresenta finalidade, dados armazenados, acesso, retenção e limites da base legal. O botão registra a leitura da versão do aviso em `preferences`, no IndexedDB. Isso não identifica uma pessoa nem constitui consentimento genérico. Outro navegador tem sua própria leitura. A recriação da demonstração preserva essa preferência.

## Seus dados

A rota `/#/your-data`, acessível no rodapé e em Missão, apresenta o aviso completo e opera sobre o perfil ativo:

- Exportação JSON: perfil fictício, check-ins, mensagens e pedido de exclusão. Não exporta outros perfis ou preferências compartilhadas. Alertas e linha de base são derivados e não integram a cópia. Não existe importação nem portabilidade regulamentada.
- Pedido de exclusão: protocolo local pendente, sem envio, executor remoto ou prazo prometido. Repetir mantém o mesmo pedido.
- Exclusão imediata: confirmação explícita antes de apagar check-ins, mensagens e pedido daquele perfil, numa transação. Mantém o perfil fictício para evitar recriação automática do histórico. Outros tripulantes e preferências gerais permanecem. Alertas, linha de base e correlações são recalculados vazios.

Os registros não reaparecem ao recarregar. “Recriar demonstração” é uma ação separada que limpa registros, mensagens e pedidos de todos os perfis e gera novos dados simulados. Arquivos já exportados não são apagados pelo app.

## Comunicação por texto

A rota `/#/medical-contact`, acessível por Alertas, Missão e rodapé, permite escrever até 2.000 caracteres e salvar para mostrar a tela ao oficial médico. Há histórico por perfil, status “salva localmente — não enviada”, validação de mensagem vazia e opção de exportação/exclusão em Seus dados. Texto é renderizado pelo React como texto, sem HTML inserido.

Não há envio, notificação, confirmação de leitura, resposta médica ou destinatário autenticado. Essa parte depende dos papéis, permissões e central de bordo do Davi. Em urgência, a interface orienta acionar a equipe pelo meio disponível, sem aguardar resposta na tela.

## Acesso e retenção

Qualquer pessoa com acesso ao navegador pode trocar de perfil. Essa seleção não comprova identidade. O banco não é criptografado. Os dados permanecem até exclusão, limpeza do navegador, remoção do armazenamento pelo navegador ou recriação da demonstração. Nenhuma mensagem, pedido ou dado de saúde sai do dispositivo pelo app. Abrir referências externas e baixar uma cópia são ações separadas do usuário.

## Enquadramento jurídico a validar para uso real

O [texto atualizado da LGPD, disponibilizado pela Câmara](https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html) condiciona a tutela da saúde do art. 11, II, f a procedimentos de profissionais de saúde, serviços de saúde ou autoridade sanitária. A interface explica essa condição e não presume que o demonstrador a satisfaça. O art. 18 prevê direitos, cuja aplicação depende da hipótese legal; uma cópia JSON e exclusão local não esgotam essas obrigações.

Antes de uso com pessoas reais, definir controlador e contato, base legal, autenticação institucional, autorização por papel, auditoria, criptografia, política de retenção, tratamento de solicitações e destino das cópias. Esses pontos não estão implementados por esta etapa. Login por PIN e demais controles pertencem à frente do Davi.

## Validação desta entrega

`npm run typecheck`, `npm test` (29 testes) e `npm run build` passaram. O teste `scripts/verify-larissa.mjs` usa Edge headless em Windows com perfil temporário isolado, sem tocar no navegador pessoal. Com o Vite ativo em `127.0.0.1:5173`, executar `node scripts/verify-larissa.mjs`. Requer Node com `WebSocket` global (a execução desta entrega usou Node 26) e Edge no caminho indicado no script.

O teste cobre aviso antes do seed, migração v3→v4 preservando registros, validação de mensagens, exportação restrita ao perfil, pedido idempotente, renderização de texto sem interpretar HTML, formulário em viewport de celular, confirmação de exclusão pela interface, limpeza do estado derivado, preservação de outro perfil, persistência após recarregar e reset preservando a leitura. Não substitui a avaliação com leitor de tela ou a revisão jurídica/clínica.

Capturas obtidas no navegador de teste: [Seus dados no desktop](capturas/seus-dados-desktop.png) e [comunicação por texto no celular](capturas/comunicacao-mobile.png). Para regenerar: `node scripts/verify-larissa.mjs --screenshots`. O script deixa um perfil temporário identificado no terminal, com dados exclusivamente fictícios.
