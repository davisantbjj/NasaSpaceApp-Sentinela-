# Como o Sentinela funciona

Explicação completa do aplicativo: o que ele faz, como cada indicador é medido, como o app compara as medidas e decide o nível de alerta, e como os dados da demonstração foram montados. Os números deste documento vêm de `src/rules/rules.json`, `src/rules/` e `src/content/indicators.ts`. Se esses arquivos mudarem, atualize aqui também.

> Protótipo de apoio à decisão. Não é dispositivo médico e não faz diagnóstico. Os dados da tripulação são simulados e as faixas são de demonstração (marcadas com `"demo": true`).

## 1. Ideia geral

O astronauta faz um **check-in diário**: informa até quinze indicadores de saúde. O app compara cada valor com **duas referências** e mostra o resultado de três formas:

- numa **figura humana** em que cada sistema do corpo fica verde, amarelo ou vermelho;
- numa **lista de alertas**, cada um explicando o que mudou e o que fazer;
- em **gráficos de tendência** com a faixa geral e o padrão pessoal desenhados.

Tudo roda no navegador, sem servidor e sem internet. Os dados ficam no próprio dispositivo (IndexedDB).

## 2. O caminho de um dado, do check-in ao alerta

1. O tripulante abre o **check-in**. Só aparecem os indicadores que ele acompanha (cada tripulante tem a sua lista). Cada indicador é um passo, e qualquer passo pode ser pulado.
2. O app valida a digitação. Aceita vírgula ou ponto e recusa valores impossíveis (por exemplo, temperatura fora de 30 a 45 °C). Esses limites só evitam erro de digitação e não são faixas clínicas.
3. Antes de salvar, o tripulante revisa tudo. Refazer o check-in no mesmo dia substitui o registro do dia.
4. O registro é salvo no dispositivo.
5. O **motor de regras** (`src/rules/engine.ts`) avalia o registro de hoje junto com o histórico do tripulante:
   - calcula a **linha de base pessoal** (seção 4);
   - compara cada valor com a **faixa geral** e com a **linha de base** (seção 5);
   - gera um **alerta** para cada indicador que não ficou verde (seção 6).
6. O nível de cada **região do corpo** é o pior nível entre os alertas daquela região. É isso que pinta a figura humana.
7. Em paralelo, o app procura indicadores que **mudaram juntos** (seção 8).

Os alertas e as linhas de base não são gravados. São recalculados a partir dos registros sempre que a tela abre. Assim, mudar uma regra no `rules.json` muda o resultado na hora, sem dado velho guardado.

## 3. Os quinze indicadores e como medir

| Indicador | Unidade | Região do corpo | Como medir (texto mostrado no app) |
| --- | --- | --- | --- |
| Pressão arterial | mmHg (sistólica e diastólica) | Coração | Sente-se preso ao assento, descanse 5 minutos e use o medidor de braço. Digite os dois números. |
| Frequência cardíaca | bpm | Coração | Meça em repouso, antes do exercício. Use o oxímetro de dedo ou conte os batimentos por 1 minuto. |
| Temperatura | °C | Defesas do corpo | Use o termômetro de bordo, sempre no mesmo horário e longe do exercício. |
| Glicemia | mg/dL | Metabolismo | Meça em jejum, com o medidor de ponta de dedo, antes da primeira refeição. |
| Sono | horas | Mente e sono | Informe quantas horas dormiu no último período de descanso, sem contar o tempo acordado no saco de dormir. |
| Humor | escala de 1 a 5 | Mente e sono | Escolha o rosto que melhor descreve como você se sentiu na maior parte do dia. |
| Estresse | escala de 1 a 5 | Mente e sono | Escolha o número que melhor descreve o seu estresse na maior parte do dia. |
| Carga de trabalho | escala de 1 a 5 | Mente e sono | Escolha o número que melhor descreve o volume de trabalho de hoje. |
| Tempo de reação | ms (média do teste) | Mente e sono | Teste no próprio app: quando aparecer o sinal, tocar na área ou apertar espaço o mais rápido possível. 3 minutos, ou 30 s na versão curta para demonstração. Respostas antes do sinal não entram na média. |
| Exercício | minutos | Ossos e músculos | Digite os minutos de aeróbico (correr, pedalar, remar) e de treino resistido (contra carga ou resistência), com o equipamento da nave. O app soma os dois. Não depende de um aparelho específico: vale para a esteira, a bicicleta e o aparelho resistido da estação e para o aparelho compacto da Orion. |
| Treino resistido | minutos | Ossos e músculos | É o segundo campo do passo de exercício, sem passo próprio. |
| Radiação | µSv (microsieverts) | Corpo inteiro | Leia a dose acumulada no dia no seu dosímetro pessoal e digite o valor. |
| Visão | 0, 1 ou 2 | Olhos e visão | Leia o cartão de teste de perto com um olho de cada vez e compare com o que via no começo da missão. 0 = sem mudança, 1 = mudança leve, 2 = mudança clara. |
| Medicação | lista de marcar | Corpo inteiro | Marque cada dose prevista para hoje que você já tomou. A dose que ficar sem marcar conta como não tomada. Só aparece para quem tem medicação prevista. |
| Sintomas | lista de marcar | Corpo inteiro | Marque tudo o que sentiu hoje. Se não sentiu nada, avance sem marcar. |

Cada passo do check-in também mostra o **por que medir**, com um dado da NASA (por exemplo: os ossos perdem de 1% a 1,5% de densidade por mês sem gravidade; cerca de 70% dos astronautas da estação têm inchaço no fundo do olho).

## 4. A linha de base pessoal

Cada pessoa tem o seu normal. Uma frequência de 58 bpm pode ser ótima para um e estranha para outro. Por isso, além da faixa geral, o app aprende o padrão de cada tripulante.

**Como é calculada** (`src/rules/baseline.ts`):

- É a **média dos primeiros 7 dias válidos** de cada indicador (`baselineDays: 7`).
- Um dia é válido se o valor estava **dentro da faixa verde geral**. Dias fora dela são descartados, para que um começo de missão já alterado não vire o "normal" da pessoa.
- Na pressão arterial, sistólica e diastólica têm linhas de base separadas.
- Enquanto não houver 7 dias válidos, a linha de base está **em formação**: ela não gera alerta de desvio, e os alertas daquele indicador saem com confiança baixa.

**Quais indicadores usam linha de base, e em que sentido o desvio preocupa:**

| Indicador | Usa linha de base? | Desvio que conta |
| --- | --- | --- |
| Pressão arterial | Sim | Para cima ou para baixo |
| Frequência cardíaca | Sim | Para cima ou para baixo |
| Glicemia | Sim | Para cima ou para baixo |
| Sono | Sim | Só para baixo (dormir menos) |
| Exercício | Sim | Só para baixo (treinar menos) |
| Treino resistido | Sim, e só ela (sem faixa geral) | Só para baixo (menos treino resistido) |
| Radiação | Sim | Só para cima (dose maior) |
| Temperatura | Não | Só a faixa geral |
| Humor | Não | Só a faixa geral |
| Estresse | Não | Só a faixa geral |
| Carga de trabalho | Não | Só a faixa geral |
| Tempo de reação | Sim, e só ela (sem faixa geral) | Só para cima (reação mais lenta) |
| Visão | Não | Só a faixa geral |
| Medicação | Não | Amarelo quando uma dose prevista não foi tomada |
| Sintomas | Não | Cada sintoma tem nível fixo |

## 5. A comparação: faixa geral e desvio pessoal

Cada valor passa por duas comparações. **O nível final é sempre o pior dos dois.** A linha de base só pode piorar o nível, nunca melhorar: um valor fora da faixa geral nunca fica verde só porque é "normal para a pessoa".

### 5.1 Faixa geral

- Dentro da faixa **verde**: verde.
- Fora da verde, mas dentro da **amarela**: amarelo.
- Fora da amarela: **vermelho**.

Os limites contam como dentro da faixa: 7 h de sono é verde, e 6,9 h é amarelo.

| Indicador | Verde | Amarelo | Vermelho |
| --- | --- | --- | --- |
| Pressão sistólica | 100 a 130 | 90 a 99 ou 131 a 140 | abaixo de 90 ou acima de 140 |
| Pressão diastólica | 60 a 85 | 55 a 59 ou 86 a 90 | abaixo de 55 ou acima de 90 |
| Frequência cardíaca | 60 a 100 bpm | 50 a 59 ou 101 a 120 | abaixo de 50 ou acima de 120 |
| Glicemia | 70 a 99 mg/dL | 60 a 69 ou 100 a 125 | abaixo de 60 ou acima de 125 |
| Temperatura | 36,1 a 37,2 °C | 35,5 a 36,0 ou 37,3 a 37,9 | abaixo de 35,5 ou acima de 37,9 |
| Sono | 7 a 9 h | 5 a 6,9 ou 9,1 a 10 | abaixo de 5 ou acima de 10 |
| Humor | 4 e 5 | 3 | 1 e 2 |
| Estresse | 1 a 3 | 4 e 5 | Nunca |
| Carga de trabalho | 1 a 3 | 4 e 5 | Nunca |
| Tempo de reação | Sem faixa geral | Só por desvio do padrão pessoal (mais lento) | Nunca |
| Exercício | 60 a 150 min | 30 a 59 ou 151 a 180 | abaixo de 30 ou acima de 180 |
| Treino resistido | Sem faixa geral | Só por desvio do padrão pessoal | Nunca |
| Visão | 0 (sem mudança) | 1 (mudança leve) | 2 (mudança clara) |
| Radiação | sem faixa geral | só por desvio pessoal | nunca fica vermelha |

Na pressão, cada número é avaliado separadamente e vale o pior. Por exemplo, 128/88 é amarelo por causa da diastólica.

A radiação não tem faixa geral porque a dose depende muito de onde a nave está, e não existe um valor diário de referência confiável para alerta. Ela é comparada só com o histórico do próprio tripulante. Os cerca de 150 µSv por dia do detector Radi-N2 aparecem apenas como escala, em texto, porque medem só nêutrons, na estação espacial.

### 5.2 Desvio da linha de base

Um indicador fica **amarelo por desvio pessoal** quando:

1. a linha de base está pronta (7 dias válidos);
2. nos **últimos 3 registros** (`sustainedDays: 3`, incluindo hoje), o valor ficou **mais de 15%** (`baselineDeviationPercent: 15`) longe da média pessoal;
3. os 3 desvios estão **no mesmo sentido** e no sentido que preocupa para aquele indicador (tabela da seção 4).

O cálculo é `desvio % = (valor − média pessoal) ÷ média pessoal × 100`.

Um dia isolado fora do padrão não gera alerta. É preciso que o desvio se mantenha por 3 registros, para não alarmar à toa. O desvio pessoal só leva até amarelo. O vermelho vem apenas da faixa geral ou de um sintoma vermelho.

### 5.3 Exemplos

**Sono abaixo da faixa (é o caso da Ana).** Ela dormiu 5,2 h. A faixa verde é de 7 a 9 h, e 5,2 está dentro da amarela (5 a 10). O resultado é **amarelo pela faixa geral**. O alerta diz: "Sono está em 5,2 h. Faixa geral: 7 a 9 h".

**Desvio pessoal sem sair da faixa.** A linha de base de frequência cardíaca de um tripulante é 67 bpm. Nos últimos 3 dias ele registrou 78, 79 e 80 bpm. Todos estão dentro da faixa verde geral (60 a 100), mas cerca de 16% a 19% acima do padrão dele, no mesmo sentido. O resultado é **amarelo por desvio pessoal**. O alerta diz algo como: "Frequência cardíaca está 19,4% acima do seu padrão há 3 dias. Seu padrão pessoal: 67 bpm (7 dias)".

**Os dois juntos.** Se o valor está fora da faixa geral e também desviado do padrão, vale o pior nível, e o alerta mostra a referência da faixa geral.

## 6. O alerta e as suas seis partes

Indicador verde não gera alerta. Todo alerta amarelo ou vermelho tem as seis partes abaixo:

| Parte | O que diz | De onde vem |
| --- | --- | --- |
| O que mudou | O valor de hoje, ou quanto se afastou do padrão e há quantos dias | Calculado pelo motor |
| Em relação a | A faixa geral ou o padrão pessoal usado na comparação | Calculado pelo motor |
| Por que importa | O risco de saúde ligado ao indicador | `rules.json` |
| O que fazer | Ação para o nível amarelo ou para o vermelho | `rules.json` |
| Confiança do dado | Normal ou baixa, com o motivo | Calculado pelo motor |
| Fonte | Link para a página de risco da NASA | `rules.json` |

A **confiança** é baixa em três situações:

- a linha de base ainda está em formação (o alerta diz "x de 7 dias");
- é a primeira medida do indicador, sem histórico para comparar;
- é um sintoma, que é autorrelato, sem medida objetiva.

**Nível vermelho:** o alerta é marcado para **aviso à equipe médica em solo** no próximo contato. No protótipo isso é só uma marcação; nada é enviado.

Nas telas, o nível nunca é mostrado só pela cor. Verde aparece com "OK" e ✓, amarelo com "Atenção" e !, e vermelho com "Atenção imediata" e um triângulo.

## 7. Sintomas

Cada sintoma marcado tem um nível fixo, definido em `rules.json`. O alerta de sintomas fica com o pior nível entre os marcados.

| Sintoma | Nível |
| --- | --- |
| Dor de cabeça, enjoo, tontura, cansaço fora do comum, dor nas costas, nariz entupido, irritação na pele | Amarelo |
| Dor no peito, falta de ar | Vermelho |

### Medicação

Cada tripulante pode ter uma lista de medicação prevista (na demonstração: Ana e Lia, com nomes fictícios). No check-in, a pessoa marca as doses que tomou. Uma dose prevista sem marcar gera alerta **amarelo** (`missedLevel` em `rules.json`), com confiança baixa, porque é autorrelato. O motor atual não gera vermelho por medicação. Fonte: risco da NASA de remédios ineficazes ou tóxicos em voos longos.

## 8. "Mudaram juntos" (correlações)

O app acompanha quatro pares de indicadores:

- sono e humor;
- exercício e humor;
- sono e frequência cardíaca;
- sono e tempo de reação (fadiga: num estudo com 24 astronautas na estação, dormir 6 horas ou menos veio junto com reação mais lenta).

Num dia, um indicador "se afastou" se saiu da faixa verde geral ou passou do limite de desvio pessoal no sentido que preocupa. Se os dois indicadores de um par se afastaram nos mesmos dias, por **3 registros seguidos ou mais** até o mais recente, o app mostra, por exemplo: "Sono e humor mudaram juntos nos últimos 4 dias".

Isso **não** é alerta, **não** muda nenhum nível e **nunca** afirma que um indicador causou o outro. Só indica que vale a pena olhar os dois juntos.

## 9. Ambiente da missão

O ambiente atual é estação, trânsito, Lua ou Marte. O ambiente **só muda a explicação** do alerta, com uma nota de contexto, e **nunca muda o nível**. As faixas são as mesmas em todos os ambientes.

Hoje só a radiação tem notas por ambiente. Por exemplo: "A estação fica dentro da magnetosfera, que bloqueia boa parte da radiação" e "A Lua fica fora da magnetosfera. Use as áreas mais protegidas do habitat."

### Perfil da missão

O Sentinela serve para qualquer nave. Em **Missão**, a equipe escolhe um perfil de referência, que descreve o tipo de missão (a nave aparece só como exemplo). Cada perfil tem veículo, tamanho da tripulação, duração e fases, e **a fase de hoje define o ambiente**. Trocar o ambiente à mão continua possível (por exemplo, para a demonstração); o app avisa que o ambiente está fora da fase e oferece voltar a ele.

| Perfil | Exemplo | Duração | Fases | Fonte |
| --- | --- | --- | --- | --- |
| Estação em órbita baixa | Estação Espacial Internacional | 180 dias | Estação | Risco ósseo da NASA (missões de 4 a 6 meses) |
| Voo lunar curto, sem pouso | Artemis II | 10 dias | Trânsito ao redor da Lua | Página da missão Artemis II (NASA) |
| Missão a Marte (referência de planejamento) | Arquitetura de referência da NASA, não é missão marcada | 914 dias | Ida (1 a 180), superfície (181 a 719), volta (720 a 914) | NASA NTRS 20100028285 |

Os perfis ficam em `src/content/missions.ts`. Não são números de saúde e não mudam nenhum nível.

### Perda óssea estimada

No painel, a região **Ossos e músculos** mostra uma nota com a perda óssea **estimada, não medida**: os dias sem gravidade (estação e trânsito) vezes a média da NASA de 1% a 1,5% ao mês, que vale para missões de 4 a 6 meses e é um valor de grupo. Depois de 6 meses, a nota avisa que a NASA ainda não sabe se a perda continua no mesmo ritmo. Dias em gravidade parcial (Lua, Marte) não entram na conta, porque a taxa não é conhecida, e a nota diz isso. É contexto: não gera alerta. A taxa fica em `rules.json` (`context.boneLoss`).

### Radiação acumulada

No painel, a região **Corpo inteiro** mostra a dose acumulada registrada na missão: a soma das doses do dia digitadas, em µSv ou, a partir de 1.000 µSv, em mSv. Se houver dias sem leitura até o último registro, a nota diz quantos e que o total real é maior. É contexto, **não limite**: o app não avalia limites de dose da carreira nem eventos de radiação intensa, e não gera alerta pela soma. A fonte fica em `rules.json` (`context.radiationTotal`).

### Metas da semana

Em **Missão**, o cartão "Metas da semana" mostra em quantos dos últimos 7 dias (contando hoje) o sono e o exercício ficaram na faixa verde geral, com meta de 5 dias. É a gamificação leve sugerida no desafio. A meta é de demonstração, **não é prescrição**: o plano de cada tripulante vem da equipe médica. A janela, a meta e os indicadores ficam em `rules.json` (`context.weeklyGoals`); a faixa verde é a mesma dos alertas.

## 10. As telas

| Tela | O que mostra |
| --- | --- |
| Painel | Figura humana com sete regiões clicáveis (também pelo teclado). Ao lado, a lista de regiões com o nível de cada uma. Ao escolher uma região, aparecem os valores, os níveis, a linha de base e as correlações. Também avisa quando o check-in de hoje está pendente. |
| Check-in | Um indicador por passo, com "como medir" e "por que medir", revisão antes de salvar e resumo com os alertas do dia. |
| Alertas | Resumo por nível, os cartões de alerta com as seis partes e a seção "Mudaram juntos". |
| Tendências | Gráfico por indicador em 14, 30 ou 60 dias, com a faixa verde sombreada, o padrão pessoal tracejado e uma tabela com os valores. |
| Missão | Dia da missão, sequência de check-ins, escolha do ambiente, lembretes por indicador e o botão de recriar a demonstração. |

No celular, a navegação fica numa barra fixa embaixo. O contador de alertas fica vermelho quando há algum alerta vermelho.

## 11. Os dados da demonstração

Na primeira abertura, o app cria três tripulantes fictícios com **60 dias de registros terminando ontem**, para que o check-in de hoje fique pendente. Os valores variam em torno de um padrão de cada pessoa, com um gerador de números com semente fixa, então a demonstração sai sempre igual.

| Tripulante | Função | Caso preparado | Resultado no app |
| --- | --- | --- | --- |
| Ana Ribeiro | Comandante | O sono cai nos últimos 7 dias (de 7,0 até 5,2 h), o humor cai junto (de 4 para 3) e, nos 4 dias com 6 h de sono ou menos, a reação fica mais lenta (de cerca de 306 para 360 a 372 ms) | 3 alertas amarelos (sono, humor e tempo de reação), "Sono e humor mudaram juntos nos últimos 4 dias" e "Sono e tempo de reação mudaram juntos nos últimos 4 dias" |
| Lia Santos | Engenheira de voo | Mudança leve na visão nos últimos 2 dias e dor de cabeça no último | 2 alertas amarelos (visão e sintomas) |
| Kenji Mori | Médico de bordo | Tudo normal. É o único que acompanha glicemia | Nenhum alerta |

**A demonstração não tem nenhum alerta vermelho pronto.** Para mostrar o vermelho, faça um check-in ao vivo, por exemplo do Kenji, marcando "Dor no peito". Também ficam vermelhos: humor 1 ou 2, visão 2, sono abaixo de 5 h ou qualquer valor fora da faixa amarela. O botão "Recriar dados de demonstração", na tela de missão, apaga os check-ins feitos e volta ao estado inicial.

Roteiro sugerido para a apresentação:

1. Ana no painel: a região mente e sono está amarela.
2. Abrir mente e sono e mostrar o sono e o humor.
3. Ir aos alertas: as seis partes e o "mudaram juntos".
4. Nas tendências, mostrar a queda do sono contra a faixa e o padrão pessoal.
5. Trocar o ambiente para Marte e mostrar que o nível não muda, só a explicação.
6. Fazer o check-in do Kenji com dor no peito: vermelho e aviso ao solo.

## 12. Onde está cada coisa no código

| Arquivo | Papel |
| --- | --- |
| `src/rules/rules.json` | Faixas, sentido do desvio, mensagens, sintomas, notas de ambiente, pares de correlação e os parâmetros 7 dias, 3 registros e 15% |
| `src/rules/baseline.ts` | Cálculo da linha de base pessoal |
| `src/rules/engine.ts` | Comparação, nível final, alertas e nível por região |
| `src/rules/correlation.ts` | "Mudaram juntos" |
| `src/content/indicators.ts` | Textos de "como medir" e "por que medir" e limites de digitação |
| `src/data/seed.ts` | Os três tripulantes e os 60 dias simulados |
| `src/rules/engine.test.ts` | Testes do motor de regras (`npm test`) |

O motor é feito de funções puras, sem banco e sem React. Por isso dá para testar com dados prontos.

## 13. Limitações

### Privacidade e comunicação local

Antes da primeira entrada, o app apresenta finalidade, dados, acesso, retenção e condições da base legal. Depois da leitura, as rotas **Seus dados** e **Comunicação por texto** podem ser abertas por Missão ou rodapé. A comunicação também é acessível em Alertas.

Seus dados exporta somente o perfil selecionado e seus registros, mensagens e pedido. Registrar o pedido não executa nem envia exclusão. O botão separado de exclusão pede confirmação e apaga o histórico local daquele perfil, preservando o perfil fictício e os outros tripulantes. Recarregar não recria registros; recriar a demonstração é uma ação explícita que também limpa mensagens e pedidos de todos. Cópias JSON já baixadas não são apagadas.

Mensagens são texto local para mostrar à equipe: não são entregues nem têm confirmação de leitura. Cada pessoa entra com o próprio PIN, e o texto fica cifrado no aparelho. Detalhes em `docs/privacidade.md`.

Missão mostra uma nota educativa de readaptação à gravidade, com contexto pelo campo `sex`, sem mudar classificação. A rastreabilidade das faixas está em `rangeEvidence`, no JSON, e em `docs/pesquisa/revisao-faixas.md`. A revisão documental não valida clinicamente os cortes.

- As faixas são de demonstração e ainda precisam de revisão da equipe (ver `TASKS.md`).
- Os dados ficam no navegador onde o app foi aberto, cifrados com uma chave por tripulante: o PIN de um tripulante não abre os dados de outro. Limites: o PIN curto (4 a 6 dígitos) pode ser descoberto testando todas as combinações por quem copiar o banco; e, como tudo roda num navegador só, a chave privada do solo fica no mesmo aparelho, cifrada no PIN do solo.
- O aviso ao solo é só uma marcação, e os lembretes aparecem só dentro do app.
- Humor, estresse, carga de trabalho, visão, medicação e sintomas são autorrelato. O app não substitui exame médico.

## 14. Fontes

As mensagens de "por que importa" apontam para as páginas de risco da NASA. O levantamento completo está em `docs/pesquisa/`, principalmente em `riscos-nasa-links-completo.md`.
