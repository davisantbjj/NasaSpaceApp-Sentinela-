# Sentinela

Aplicativo web de monitoramento de saúde para astronautas em missões longas. Feito para o NASA Space Apps Challenge 2026, desafio "Create Health Monitoring Software for Astronauts on Space Missions".

Projeto da equipe **CosmoTI**.

O astronauta registra indicadores de saúde todo dia, vê o estado de cada sistema do corpo numa figura humana clicável e recebe orientação sobre o que fazer.

> Protótipo de apoio à decisão. Não é dispositivo médico e não faz diagnóstico. Os dados da tripulação são simulados.

## Estado

As cinco telas funcionam com dados simulados: painel com o corpo humano, check-in diário, alertas, tendências e missão. Faltam a revisão das faixas pela equipe, a publicação e o material de entrega. Detalhes em [TASKS.md](TASKS.md).

Na primeira abertura o app cria três tripulantes fictícios com 60 dias de registros. A Ana Ribeiro tem o caso preparado para a demonstração: o sono cai por vários dias e o humor cai junto.

## Como rodar

Precisa de Node.js 22 ou mais novo.

```bash
npm install
npm run dev
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` | Checagem de tipos |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |

## Como funciona

- Roda inteiro no navegador, sem servidor e sem rede em tempo de uso.
- Os dados ficam no dispositivo (IndexedDB, via Dexie).
- As regras de alerta ficam em `src/rules/rules.json`, fora do código.
- Cada indicador é comparado com a faixa geral e com a linha de base pessoal. Vale o pior dos dois níveis.
- Três níveis: verde, amarelo e vermelho.

Tecnologias: React 18, TypeScript, Vite, React Router, Zustand, Dexie, Recharts, vite-plugin-pwa e Vitest.

## Documentação

As tarefas de Larissa incluem o aviso de primeira entrada, a tela **Seus dados** (cópia JSON, pedido de exclusão e registro de quem abriu os dados), comunicação por texto para mostrar à equipe de bordo e contexto educativo de readaptação à gravidade em **Missão**. Acesse as telas pelo menu do avatar, por Missão ou pelo rodapé; comunicação também está em Alertas. O tripulante não apaga o próprio histórico de saúde. A entrada é por perfil e PIN de demonstração; use apenas dados fictícios.

O [roteiro da demonstração](docs/roteiro-demonstracao.md) e a [base de conteúdo da apresentação](docs/apresentacao.md) estão no repositório, sem slides ou vídeo. A [revisão documental das faixas](docs/pesquisa/revisao-faixas.md) distingue referências gerais e escolhas de demonstração; a aprovação clínica permanece pendente. Consulte também os [fluxos de privacidade](docs/privacidade.md).

| Arquivo | Conteúdo |
| --- | --- |
| [docs/como-funciona.md](docs/como-funciona.md) | Como o app funciona: medições, comparações, níveis, alertas e dados da demonstração |
| [TASKS.md](TASKS.md) | Tarefas feitas e pendentes |
| [CONTEXTO-IA.md](CONTEXTO-IA.md) | Resumo do projeto e regras para assistentes de IA |
| [docs/arquitetura.md](docs/arquitetura.md) | Camadas, tipos de dados, motor de regras |
| [docs/especificacao-de-dados.md](docs/especificacao-de-dados.md) | Todo dado guardado: campos, tipos, unidades, cifra, tabelas e pacotes |
| [docs/tarefas-nasa-2026-11-15.md](docs/tarefas-nasa-2026-11-15.md) | Tarefas da revisão com as fontes da NASA (N1 a N21) |
| [docs/estrutura-do-projeto.md](docs/estrutura-do-projeto.md) | Árvore de pastas e papel de cada arquivo |
| [docs/diagramas/](docs/diagramas/) | Visão geral, fluxo do check-in, dados, níveis e navegação |
| [docs/pesquisa/](docs/pesquisa/) | Pesquisa e proposta que deram origem ao projeto |
| [docs/pesquisa/riscos-nasa-links-completo.md](docs/pesquisa/riscos-nasa-links-completo.md) | Riscos de saúde da NASA, com as páginas e os links de dentro delas |

## Licença

[MIT](LICENSE), Equipe CosmoTI. Os dados da demonstração são fictícios; os textos e links da NASA citados seguem as condições de uso da própria NASA.
