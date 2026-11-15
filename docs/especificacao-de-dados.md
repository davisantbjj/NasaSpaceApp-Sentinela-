# Especificação dos dados

Descreve todo dado que o Sentinela guarda: o que é cada campo, o tipo, a unidade, de onde vem, quem pode ver, onde fica gravado e como vira alerta. Escrito em 15/11/2026 a partir do código, então descreve o que existe hoje e marca separadamente o que ainda não existe.

As faixas numéricas são escolhas de demonstração. Nenhuma foi validada por profissional de saúde, e todas carregam `demo: true` e a evidência em `rangeEvidence` (ver [revisão das faixas](pesquisa/revisao-faixas.md)).

Relacionados: [arquitetura](arquitetura.md), [como funciona](como-funciona.md), [privacidade](privacidade.md), [tarefas da pesquisa de 15/11](tarefas-nasa-2026-11-15.md).

## Os três lugares onde um dado vive

| Lugar | O que guarda | Quem abre |
| --- | --- | --- |
| Aparelho do tripulante | Banco IndexedDB `sentinela`, com os registros dele e as caixas seladas que ele montou | Só quem tem a chave correspondente |
| Central de bordo | Mesmas caixas, movidas pela sincronização; a central não tem chave nenhuma | Ninguém: ela só transporta |
| Terra | Pacotes diários entregues com atraso | Só o médico do solo, com a chave privada dele |

A regra que sustenta tudo: quem monta uma caixa selada não consegue reabri-la. O tripulante sela o pacote com a chave pública do solo e o resumo com a chave pública do comandante. Por isso um alerta vermelho nunca espera alguém entrar no app.

## Catálogo de indicadores

São os 16 valores de `IndicatorId`. A coluna "linha de base" diz se o valor também é comparado com o padrão da própria pessoa, e em que sentido o desvio preocupa.

| id | Unidade | Entrada | Verde | Amarelo | Linha de base | Região |
| --- | --- | --- | --- | --- | --- | --- |
| `bloodPressure` | mmHg | dois números, 40 a 250 | sist. 100–130, diast. 60–85 | sist. 90–140, diast. 55–90 | sim, nos dois sentidos | coração |
| `heartRate` | bpm | número, 20 a 250 | 60–100 | 50–120 | sim, nos dois sentidos | coração |
| `glucose` | mg/dL | número, 20 a 600 | 70–99 | 60–125 | sim, nos dois sentidos | metabolismo |
| `temperature` | °C | número, 30 a 45, passo 0,1 | 36,1–37,2 | 35,5–37,9 | não | defesas |
| `sleepHours` | h | número, 0 a 24, passo 0,1 | 7–9 | 5–10 | sim, para baixo | mente |
| `mood` | escala | 1 a 5, com rostos | 4–5 | 3 | não | mente |
| `stress` | escala | 1 a 5 | 1–3 | 4–5 | não | mente |
| `workload` | escala | 1 a 5 | 1–3 | 4–5 | não | mente |
| `reactionTime` | ms | vem do teste, não digitado | sem faixa geral | sem faixa geral | sim, para cima | mente |
| `exerciseMinutes` | min | número, 0 a 600 | 60–150 | 30–180 | sim, para baixo | ossos e músculos |
| `resistanceMinutes` | min | número, 0 a 600 | sem faixa geral | sem faixa geral | sim, para baixo | ossos e músculos |
| `radiationDose` | µSv | número, 0 a 100000 | sem faixa geral | sem faixa geral | sim, para cima | corpo inteiro |
| `bodyMassKg` | kg | número, 20 a 300 | até 5% de perda | acima de 5%; vermelho acima de 10% | não | corpo inteiro |
| `vision` | escala | 0 a 2 | 0 | 1 | não | olhos |
| `symptoms` | lista | caixas de marcar | nenhum marcado | ver tabela de sintomas | não | corpo inteiro |
| `medication` | lista | tomou ou não, por dose prevista | todas tomadas | dose esquecida | não | corpo inteiro |

Os limites de entrada (40 a 250 para pressão, por exemplo) evitam erro de digitação e não são faixas clínicas. Ficam em `src/content/indicators.ts`; as faixas clínicas ficam em `src/rules/rules.json`.

Cada tripulante acompanha só os indicadores de `trackedIndicators`. O check-in não pergunta o resto, e o motor não avalia o que não foi perguntado.

## Como cada valor é guardado

Tudo de um dia cabe em `DailyValues`. Todos os campos são opcionais: um dia pode ter só parte deles.

```ts
interface DailyValues {
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  glucose?: number;
  temperature?: number;
  sleepHours?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
  stress?: 1 | 2 | 3 | 4 | 5;      // 1 = muito baixo, 5 = muito alto
  workload?: 1 | 2 | 3 | 4 | 5;    // 1 = muito leve, 5 = excessiva
  reactionTime?: number;           // média do teste, em ms
  reactionTest?: ReactionTestDetails;
  exerciseMinutes?: number;        // total do dia
  resistanceMinutes?: number;      // parte do total feita em treino resistido
  radiationDose?: number;
  bodyMassKg?: number;             // massa periódica, comparada ao início da missão
  mealsCompleted?: number;         // preparado para N12
  waterSufficient?: boolean;       // preparado para N12
  sleepQuality?: 1 | 2 | 3 | 4 | 5; // preparado para N14
  vision?: 0 | 1 | 2;
  symptoms?: string[];             // ids definidos em rules.json
  medication?: MedicationDose[];
  sources?: Partial<Record<IndicatorId, DataSource>>;
}
```

Detalhes que valem explicar:

- Pressão é o único indicador com dois números. Cada um tem faixa e linha de base próprias, e o pior dos dois decide o nível.
- Escalas de 1 a 5 são números, não texto. Os rótulos ("muito mal", "neutro") vivem nas traduções, e os símbolos em `indicators.ts`. Estresse e carga são invertidos em relação ao humor: 5 é ruim.
- Exercício guarda o total do dia e, dentro dele, quantos minutos foram de treino resistido. `resistanceMinutes` nunca deve passar de `exerciseMinutes`.
- Sintomas é uma lista de identificadores, nunca texto livre. Texto livre viraria dado clínico não estruturado e não poderia ser traduzido.

### Sintomas

Nove itens fixos, cada um com o nível que gera quando marcado. São escolhas de demonstração, não um protocolo de triagem.

| id | Nível |
| --- | --- |
| `headache` | amarelo |
| `nausea` | amarelo |
| `dizziness` | amarelo |
| `fatigue` | amarelo |
| `backPain` | amarelo |
| `congestion` | amarelo |
| `skinRash` | amarelo |
| `chestPain` | vermelho |
| `shortBreath` | vermelho |

Quando mais de um é marcado, vale o pior. O alerta de sintoma sempre nasce com confiança baixa, porque é autorrelato.

### Medicação

Duas estruturas diferentes. A primeira fica no cadastro do tripulante e descreve o que está previsto:

```ts
interface PlannedMedication {
  id: string;
  label: string;     // "Suplemento de vitamina D"
  schedule: string;  // "1 vez ao dia"
}
```

A segunda fica no registro do dia e diz o que aconteceu:

```ts
interface MedicationDose {
  id: string;
  label: string;   // copiado do plano
  taken: boolean;
}
```

O nome é copiado de propósito para o registro continuar legível se a lista prevista mudar depois. Se o tripulante não tem lista, o check-in nem pergunta. Uma dose prevista e não tomada gera alerta amarelo, com gatilho `missedMedication`.

Um limite conhecido: a lista prevista fica no cadastro sem cifra, diferente do resto. O aviso de privacidade registra isso.

### Teste de reação

```ts
interface ReactionTestDetails {
  mode: 'full' | 'short';
  completed: boolean;
  elapsedSeconds: number;
  validResponses: number;
  anticipations: number;
}
```

O valor que entra no motor é só `reactionTime`, a média em milissegundos. O resto serve para julgar a qualidade: um teste interrompido ou com muitas antecipações não vale o mesmo que um completo. Registros antigos podem não ter esse objeto.

### Origem do dado

```ts
type DataSource = 'manual' | 'wearable' | 'dosimeter';
```

Fica em `values.sources`, um por indicador. Campo ausente significa digitado. Hoje o app não lê aparelho nenhum: o campo registra o que a pessoa declara ter usado. É a base para a leitura automática no futuro, e serve para o médico saber como o número chegou ali.

## O registro do dia

```ts
interface DailyRecord {
  id: string;          // crewId + '_' + date
  crewId: string;
  date: string;        // AAAA-MM-DD
  missionDay: number;
  values: DailyValues;
  createdAt: string;
  syncedAt?: string;   // quando chegou à central
}
```

O identificador é o tripulante mais a data, então existe no máximo um registro por pessoa por dia. Refazer o check-in substitui o anterior, e isso é proposital: evita duplicar e torna o reenvio seguro.

`syncedAt` é o que separa o que é só do aparelho do que já é da missão. O próprio tripulante vê tudo o que está no aparelho dele; os outros só veem o que tem `syncedAt`.

## Como um valor vira alerta

Três perguntas, nesta ordem.

1. O valor está na faixa geral? Dentro do verde é verde. Fora do verde mas dentro do amarelo é amarelo. Fora dos dois é vermelho. Indicador sem faixa geral nunca gera vermelho por essa via.

2. O valor fugiu do padrão da pessoa? A linha de base é a média dos 7 primeiros dias válidos daquela série. Dias com valor fora da faixa verde não entram na média e são contados em `excludedDays`, para a conta não ser contaminada por um dia ruim logo no início. Com a linha de base pronta, o motor olha os últimos 3 registros, incluindo o de hoje: se os três desviarem mais de 15% no sentido que preocupa, sai um amarelo.

3. Qual dos dois vale? O pior. Faixa vermelha com desvio amarelo dá vermelho.

Três observações que mudam a leitura do resultado:

- Os 3 registros não precisam ser dias seguidos no calendário. São os três últimos que existem.
- O desvio pessoal sozinho nunca gera vermelho.
- `notifyGround` fica verdadeiro só no vermelho. Hoje é só uma marcação: o pacote sai com prioridade, mas ninguém é avisado de verdade.

A confiança do alerta cai para baixa em quatro situações: linha de base ainda em formação, medida única sem histórico, sintoma autorrelatado e medicação autorrelatada.

### O alerta

```ts
interface Alert {
  id: string;
  crewId: string;
  date: string;
  indicator: IndicatorId;
  region: BodyRegion;
  level: Level;
  trigger: 'generalRange' | 'baselineDeviation' | 'symptom' | 'missedMedication';
  whatChanged: LocalizedText;
  reference: LocalizedText;
  whyItMatters: string;
  whatToDo: string;
  environmentNote?: string;
  confidence: 'normal' | 'low';
  confidenceNote?: LocalizedText;
  notifyGround: boolean;
  sourceUrl: string;
}
```

Alertas, linhas de base e correlações não são gravados. São recalculados a partir dos registros toda vez. Mudar uma regra no `rules.json` atualiza o histórico inteiro, sem migração.

`LocalizedText` é uma chave de tradução com parâmetros, nunca texto pronto. É o que permite o mesmo alerta sair em português ou inglês.

### Correlação

Quatro pares são observados: sono e tempo de reação, sono e humor, exercício e humor, sono e frequência cardíaca. O texto diz que os dois mudaram juntos e nunca que um causou o outro.

## A pessoa e a missão

```ts
interface CrewMember {
  id: string;
  name: string;
  role: string;
  missionStart: string;              // AAAA-MM-DD
  trackedIndicators: IndicatorId[];
  sex?: 'female' | 'male';
  medications?: PlannedMedication[];
  startBodyMassKg?: number;           // referência da N11
}
```

O campo `sex` escolhe a figura do mapa do corpo e libera uma nota educativa sobre readaptação à gravidade. Não muda faixa, linha de base nem nível de alerta. Sem o campo, a orientação fica geral.

As configurações da missão são uma linha só para o app inteiro:

```ts
interface Settings {
  environment: Environment;          // station | transit | moon | mars
  activeCrewId: string;
  reminders: { indicator: IndicatorId; everyDays: number }[];
  missionProfile?: MissionProfileId;
  environmentManual?: boolean;
  cabinCo2Mmhg?: number;              // média de uma hora, dado da missão (N13)
}
```

Os perfis de missão dão as fases e o ambiente de cada dia:

| Perfil | Duração | Fases |
| --- | --- | --- |
| `station` | 180 dias | estação do dia 1 ao 180 |
| `lunarFlyby` | 10 dias | trânsito do dia 1 ao 10 |
| `mars` | 914 dias | trânsito 1–180, superfície 181–719, trânsito 720–914 |

O ambiente muda só o texto do alerta e as notas de contexto, nunca o nível. Quando alguém troca o ambiente à mão, `environmentManual` marca que a escolha não veio da fase da missão.

## Quem vê o quê

```ts
type Role = 'crew' | 'commander' | 'medicalOfficer' | 'groundSurgeon';
```

| Papel | Vê |
| --- | --- |
| Tripulante | só os próprios dados |
| Comandante | os próprios dados; dos outros, só a data do último check-in e se há vermelho |
| Oficial médico | todos os tripulantes |
| Médico do solo | não abre painel de ninguém; só os pacotes que chegaram à Terra |

O resumo do comandante é um objeto minúsculo, selado para ele:

```ts
interface CrewStatusSummary {
  crewId: string;
  lastCheckinDate: string;
  red: boolean;
}
```

Sem valores, sem indicador, sem nome do alerta. É a diferença entre saber que alguém precisa de atenção e saber o que a pessoa tem.

## O que é cifrado e o que fica aberto

Cada tripulante tem uma chave de dados própria. A chave fica guardada dentro do perfil de quem pode abrir, cifrada com o PIN daquela pessoa. O PIN nunca é gravado, e a chave é derivada dele com 600 mil iterações.

```ts
interface Sealed { iv: Uint8Array; data: ArrayBuffer; }
```

| Tabela | Aberto | Selado |
| --- | --- | --- |
| `records` | id, tripulante, data, dia da missão, horários | todos os valores |
| `reviews` | ids e horários | nível, indicador e texto da anotação |
| `packets` | id, tripulante, data, prioridade, fila | o conteúdo inteiro |
| `medicalMessages` | id, tripulante, data | o texto |
| `statuses` | id, tripulante, data, fila | o resumo |
| `crew` | tudo, inclusive a medicação prevista | nada |

O que fica aberto é o mínimo para a central conseguir ordenar e mover as caixas sem ter chave. As chaves públicas do solo e do comandante ficam abertas de propósito, porque servem só para selar.

## As tabelas do banco

O banco se chama `sentinela` e está na versão 11.

| Tabela | Chave | Guarda |
| --- | --- | --- |
| `crew` | id | cadastro dos tripulantes |
| `records` | id, com índice por tripulante e data | registros diários selados |
| `settings` | chave fixa `app` | configurações da missão |
| `profiles` | id | perfis com sal, chaves e PIN |
| `reviews` | id | alertas vistos pelo oficial médico |
| `accessLog` | id | quem abriu os dados de quem |
| `packets` | id | fila para a Terra |
| `preferences` | chave | preferências sem dado de saúde |
| `medicalMessages` | id | mensagens ao oficial médico |
| `deletionRequests` | id | pedidos de exclusão |
| `publicKeys` | id | chaves públicas do solo e do comandante |
| `statuses` | id | resumos selados para o comandante |

As versões contam a história do projeto: a 2 parou de gravar linha de base, a 4 trouxe perfis e cifra, a 7 trocou a chave única por uma chave por tripulante e precisou apagar a demonstração, e as versões 8 a 11 acrescentaram medicação, estresse e carga, treino resistido e teste de reação. Cada uma dessas últimas só acrescenta o indicador na lista do tripulante: os dias antigos ficam sem o valor novo, e isso é esperado.

Se o banco local foi gravado por uma versão mais nova do app, ou a atualização falha, o app apaga e recria a demonstração. São dados simulados, então nada de real se perde.

## O pacote que vai para a Terra

```ts
interface PacketPayload {
  crewName: string;
  crewRole: string;
  missionDay: number;
  environment: Environment;
  recordedAt: string;
  values: DailyValues;
  alerts: { id; indicator; level; whatChanged }[];
  notes: { indicator; note; seenBy; seenAt }[];
}
```

O envelope tem o que a central precisa para decidir a ordem:

```ts
interface GroundPacket {
  id: string;
  crewId: string;
  date: string;
  createdAt: string;
  priority: 'red' | 'normal';
  waitsFor: string[];
  attemptedAt?: string;
  sentAt?: string;
  deliverAt?: string;
  payload: PacketPayload;
}
```

Quatro regras governam a fila:

- `priority` vem do pior alerta do dia. Vermelho passa na frente.
- `waitsFor` lista o registro e as anotações que precisam chegar à central antes de o pacote sair. Evita mandar à Terra algo que a própria nave ainda não tem.
- Depois de `attemptedAt`, o conteúdo congela. Se o servidor gravou e a resposta se perdeu, reenviar o mesmo id com conteúdo diferente seria ignorado do outro lado. Conteúdo novo ganha id novo.
- `deliverAt` é o envio mais o atraso de comunicação do ambiente. É o que faz a tela do solo mostrar dado velho em Marte.

## Registro de acesso

```ts
interface AccessLogEntry {
  id: string;
  subjectCrewId: string;   // de quem são os dados
  actorProfileId: string;
  actorName: string;
  actorRole: Role;
  at: string;
  what: string;
}
```

Fica aberto de propósito: o tripulante precisa conseguir ler quem abriu os dados dele sem depender de chave de terceiro. Não contém valor de saúde, só o fato do acesso.

## Anotação do oficial médico

```ts
interface AlertReview {
  id: string;              // mesmo id do alerta
  crewId: string;
  date: string;
  indicator: IndicatorId;
  seenByProfileId: string;
  seenBy: string;
  seenAt: string;
  note: string;
  syncedAt?: string;
  level?: Level;
  recordCreatedAt?: string;
}
```

Os dois últimos campos existem para o "visto" não enganar: se o check-in for refeito ou o nível mudar, o alerta volta a aparecer como não visto. Um alerta marcado como visto num dia amarelo não continua visto quando o dia vira vermelho.

## Mensagens e exclusão

As duas estruturas têm estado fixo e isso é honesto quanto ao limite do protótipo:

- `MedicalMessage` nasce com `status: 'local'`. A mensagem fica cifrada no aparelho do tripulante e ainda não chega ao oficial médico.
- `DeletionRequest` nasce com `status: 'pending'`. É um pedido local, sem envio a um controlador de dados.

## Contexto que não vira alerta

Quatro blocos em `rules.json` servem para explicar, nunca para alertar.

| Bloco | O que faz |
| --- | --- |
| `boneLoss` | estimativa de perda óssea, de 1% a 1,5% ao mês, com base em estudos de 4 a 6 meses |
| `radiationTotal` | soma das doses do dia, só como contexto |
| `weeklyGoals` | metas da semana: 5 dias em 7 para sono e exercício |
| `readaptation` | avisa 7 dias antes de uma mudança de gravidade |

A estimativa de perda óssea merece cuidado na apresentação: é uma conta a partir do tempo de missão, não uma medida. A NASA não mede densidade óssea em voo.

## O formato do rules.json

É o arquivo que concentra toda decisão clínica, separado do código de propósito: mudar uma faixa não exige mexer em componente nenhum.

```
config            baselineDays 7, sustainedDays 3,
                  baselineDeviationPercent 15, demo true
indicators        um por IndicatorId
symptoms          lista com id, chave de rótulo e nível
environmentNotes  texto por ambiente (hoje só radiação)
correlationPairs  pares observados
context           blocos que não viram alerta
```

Cada indicador carrega, além das faixas: a região do corpo, o risco correspondente da NASA, os perigos do voo ligados a ele, as mensagens de por que importa e o que fazer, a fonte, a marca `demo` e o bloco `rangeEvidence`, que registra separadamente a evidência de verde, amarelo e vermelho.

`rangeEvidence` é o que torna o projeto defensável. Ele diz, por exemplo, que 60 a 100 bpm é referência geral de adulto em repouso e não uma faixa validada para astronautas.

## Dados da demonstração

Três tripulantes fictícios e 60 dias gerados por código com semente fixa, o que faz a demonstração sair igual toda vez. Nenhum valor vem de pessoa real. Os registros vão até ontem, para o check-in de hoje ficar pendente na tela.

A Ana tem um caso preparado: o sono cai durante vários dias e o humor cai depois. É o que mostra correlação e desvio sustentado numa demonstração curta. A massa corporal simulada de cada tripulante é comparada ao valor inicial da missão; o CO2 começa em 2,3 mmHg e pode ser alterado na tela Missão.

## O que ainda não existe

Da pesquisa com as fontes da NASA, quatro dados ainda não têm interface completa. Cada um tem tarefa em [tarefas-nasa-2026-11-15.md](tarefas-nasa-2026-11-15.md).

| Dado | Como entraria |
| --- | --- |
| Alimentação e água | refeições completas no dia e água suficiente |
| Qualidade do sono | escala ao lado das horas |
| Grade de Amsler | substituiria a nota de 0 a 2 da visão |
| Condicionamento | percentual do valor de antes do voo, periódico |

## Regras que o código precisa garantir

Valem como lista de verificação para quem for mexer no modelo:

1. Um registro por tripulante por dia. O id é `crewId_date` e refazer substitui.
2. Nenhum valor de saúde sai do aparelho sem estar selado.
3. O que o comandante vê nunca contém valor nem nome de indicador.
4. Alerta, linha de base e correlação são derivados, nunca gravados.
5. Todo texto visível é chave de tradução, nunca frase pronta no código.
6. Toda faixa nova nasce com `demo: true` e `rangeEvidence` preenchido.
7. Indicador fora de `trackedIndicators` não é perguntado nem avaliado.
8. Campo novo em `DailyValues` entra como opcional, e os dias antigos continuam válidos sem ele.
