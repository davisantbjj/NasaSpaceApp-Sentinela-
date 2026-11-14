# Arquitetura

## Visão em camadas

O app tem quatro camadas, todas dentro do navegador.

| Camada | Pastas | O que faz |
| --- | --- | --- |
| Apresentação | `pages/`, `components/` | Mostra telas e recebe entradas |
| Estado | `store/` | Guarda o tripulante ativo, o ambiente e os alertas calculados |
| Domínio | `rules/`, `content/`, `lib/` | Calcula linha de base, níveis e alertas |
| Persistência | `data/` | Lê e grava no IndexedDB |

O diagrama está em `diagramas/01-visao-geral.md`.

## Tipos de domínio

Definidos em `src/types/index.ts`.

```ts
export type Level = 'green' | 'yellow' | 'red';

export type IndicatorId =
  | 'bloodPressure' | 'heartRate' | 'glucose' | 'temperature'
  | 'sleepHours' | 'mood' | 'exerciseMinutes' | 'radiationDose'
  | 'vision' | 'symptoms';

export type BodyRegion =
  | 'head' | 'heart' | 'musculoskeletal' | 'immune'
  | 'metabolism' | 'mind' | 'wholeBody';

export type Environment = 'station' | 'transit' | 'moon' | 'mars';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  missionStart: string;        // data ISO, AAAA-MM-DD
  trackedIndicators: IndicatorId[];   // o check-in só pede estes
}

export interface DailyRecord {
  id: string;                  // `${crewId}_${date}`
  crewId: string;
  date: string;                // AAAA-MM-DD, um registro por dia
  missionDay: number;
  values: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    glucose?: number;
    temperature?: number;
    sleepHours?: number;
    mood?: 1 | 2 | 3 | 4 | 5;
    exerciseMinutes?: number;
    radiationDose?: number;
    vision?: 0 | 1 | 2;
    symptoms?: string[];       // ids de sintomas definidos em rules.json
  };
  createdAt: string;
}

export interface Baseline {
  crewId: string;
  indicator: IndicatorId;
  mean: number;
  sampleDays: number;          // quantos dias entraram no cálculo
  excludedDays: number;        // dias descartados por estarem fora da faixa geral
}

export interface Alert {
  id: string;
  crewId: string;
  date: string;
  indicator: IndicatorId;
  region: BodyRegion;
  level: Level;
  trigger: 'generalRange' | 'baselineDeviation' | 'symptom';
  whatChanged: string;         // "Sono caiu para 5,2 h"
  reference: string;           // "Seu padrão pessoal: 7,4 h (7 dias)" ou "Faixa geral: 7 a 9 h"
  whyItMatters: string;
  whatToDo: string;
  environmentNote?: string;    // contexto do ambiente atual, só texto
  confidence: 'normal' | 'low';
  confidenceNote?: string;     // "Linha de base com só 4 dias" ou "Medida manual única"
  notifyGround: boolean;
  sourceUrl: string;
}

export interface Correlation {
  crewId: string;
  indicators: [IndicatorId, IndicatorId];
  fromDate: string;
  toDate: string;
  description: string;         // "Sono e humor caíram juntos nos últimos 4 dias"
}

export interface Settings {
  environment: Environment;
  activeCrewId: string;
  reminders: { indicator: IndicatorId; everyDays: number }[];
}
```

Pressão arterial tem dois números. Para linha de base e gráfico, cada um é tratado como uma série separada (`systolic` e `diastolic`): `Baseline` tem o campo opcional `component`, e a regra da pressão usa `components` com uma faixa para cada número.

## Arquivo de regras

`src/rules/rules.json` guarda tudo o que é ajustável. Formato de uma regra:

```json
{
  "config": {
    "baselineDays": 7,
    "sustainedDays": 3,
    "baselineDeviationPercent": 15,
    "demo": true
  },
  "indicators": {
    "heartRate": {
      "region": "heart",
      "unit": "bpm",
      "green": { "min": 60, "max": 100 },
      "yellow": { "min": 50, "max": 120 },
      "useBaseline": true,
      "nasaRisk": "Cardiovascular Adaptations",
      "hazards": ["gravity"],
      "messages": {
        "whyItMatters": "A falta de gravidade altera a circulação e o funcionamento do coração.",
        "whatToDo": {
          "yellow": "Repita a medida após 10 minutos de repouso e registre de novo.",
          "red": "Descanse e avise o médico de bordo."
        }
      },
      "sourceUrl": "https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/",
      "demo": true
    }
  },
  "environmentNotes": {
    "radiationDose": {
      "station": "A estação fica dentro da magnetosfera, que bloqueia boa parte da radiação.",
      "transit": "Fora da magnetosfera a exposição é maior. Siga o protocolo de abrigo da missão.",
      "moon": "A Lua fica fora da magnetosfera. Use as áreas mais protegidas do habitat.",
      "mars": "Fora da magnetosfera e com resposta do solo de até 20 minutos."
    }
  }
}
```

Campos além do exemplo: `label` (nome nos textos), `components` (faixas da pressão), `valueLabels` (texto de cada valor de humor e visão), `deviationDirection` (`both`, `above` ou `below`: em que sentido o desvio pessoal é risco). A lista `symptoms` define cada sintoma com o seu nível, e `correlationPairs` define os pares comparados.

Leitura das faixas: valor dentro de `green` é verde; fora de `green` e dentro de `yellow` é amarelo; fora de `yellow` é vermelho.

`environmentNotes` só acrescenta texto ao alerta. Não existe ajuste de faixa por ambiente.

Todos os números atuais são de demonstração (`"demo": true`). Vêm de referências gerais para adultos em repouso e precisam de revisão.

Radiação: a faixa usa o histórico do próprio tripulante. O valor de cerca de 150 microsieverts por dia do Radi-N2 é só de nêutrons, medido na estação, e aparece apenas como contexto no cartão do indicador.

## Motor de regras

`src/rules/engine.ts` exporta funções puras.

```ts
evaluateRecord(
  record: DailyRecord,
  history: DailyRecord[],      // dias anteriores do mesmo tripulante
  baselines: Baseline[],
  rules: Rules,
  environment: Environment
): Alert[]

levelByRegion(alerts: Alert[]): Record<BodyRegion, Level>
```

Passos de `evaluateRecord` para cada indicador preenchido:

1. Compara o valor com a faixa geral e obtém um nível.
2. Se `useBaseline` é verdadeiro e já existe linha de base, calcula o desvio percentual em relação à média pessoal.
3. Se o desvio passa de `baselineDeviationPercent` por `sustainedDays` dias seguidos, o nível mínimo vira amarelo.
4. Fica com o pior nível entre os passos 1 e 3.
5. Se o nível não é verde, monta um `Alert` com os textos da regra, a referência usada e a nota do ambiente atual (`environmentNotes`).
6. Marca `confidence: 'low'` quando a linha de base tem menos de `baselineDays` dias válidos ou quando há só uma medida no período; `confidenceNote` diz o motivo.
7. Nível vermelho marca `notifyGround: true`.

O ambiente nunca altera o nível.

## Correlação entre indicadores

`src/rules/correlation.ts` exporta:

```ts
findCorrelations(history: DailyRecord[], baselines: Baseline[], rules: Rules): Correlation[]
```

- Procura pares de indicadores que se afastaram da linha de base no mesmo sentido de risco nos mesmos dias (por exemplo, menos sono e humor mais baixo), por pelo menos `sustainedDays` dias.
- Os pares possíveis ficam em `rules.json`, em `correlationPairs`, para não comparar tudo com tudo.
- O resultado aparece na tela de alertas e no painel da região como "mudaram juntos". O texto nunca diz que um causou o outro.
- Correlação não cria alerta nem muda nível.

`levelByRegion` devolve, para cada região do corpo, o pior nível entre os alertas daquela região. É isso que pinta a figura humana.

O diagrama de níveis está em `diagramas/04-niveis-de-alerta.md`.

## Linha de base pessoal

`src/rules/baseline.ts`:

- Usa os primeiros `baselineDays` dias válidos de cada tripulante.
- Um dia só é válido se o valor estava dentro da faixa verde geral. Dias fora dela são descartados e contados em `excludedDays`, para que um começo de missão alterado não vire o "normal" da pessoa.
- Calcula a média de cada indicador numérico.
- Antes de completar os dias necessários, o indicador é avaliado só pela faixa geral e a tela informa "linha de base em formação (4 de 7 dias)".
- O detalhe do indicador sempre mostra com quantos dias a linha de base foi formada e quantos foram descartados.
- Humor, visão e sintomas não usam linha de base.

## Persistência

Atualização de Larissa (v4): além das três tabelas originais descritas abaixo, há `preferences` (`key`, `value`) para a leitura versionada do aviso; `medicalMessages` (`id`, índices `crewId` e `createdAt`); e `deletionRequests` (`id`, índice `crewId`). Os tipos de mensagem e pedido estão em `src/types/index.ts`. O perfil também tem `sex` opcional, usado na figura e no contexto educativo, sem afetar o motor.

`privacyRepo.ts` encapsula a leitura do aviso, exportação por tripulante, pedido e exclusão; `messagesRepo.ts` valida e salva mensagens locais. Exportação usa transação de leitura e exclusão usa transação de escrita para registros, mensagens e pedidos. Nenhuma das duas inclui dados de outro tripulante. O perfil fictício é preservado na exclusão para `seedIfEmpty` não recriar dados apagados. `resetDemo` limpa também mensagens e pedidos, preservando `preferences`.

`loadCrew` consulta o aviso antes de popular a demonstração. `acknowledgePrivacy` registra sua versão e carrega os dados; `deleteActiveHealthData` exclui e recalcula o estado derivado. Novas rotas e limites estão em `docs/privacidade.md`. Elas não implementam controle de acesso: isso segue na frente do Davi.

`src/data/db.ts` define três tabelas no Dexie:

| Tabela | Chave | Índices |
| --- | --- | --- |
| `crew` | `id` | |
| `records` | `id` | `crewId`, `date`, `[crewId+date]` |
| `settings` | `key` | |

Alertas, correlações e linhas de base não são gravados. São recalculados a partir dos registros sempre que o app abre, um check-in é salvo ou o tripulante muda. Assim, mudar uma regra atualiza tudo. (A versão 1 do esquema tinha uma tabela `baselines`; a versão 2 a removeu.)

Na primeira abertura, `seed.ts` insere três tripulantes fictícios e 60 dias de dados. Um deles tem um caso preparado para a demonstração: sono caindo por vários dias, seguido de queda de humor.

## Estado

`useAppStore` (Zustand) guarda:

- `activeCrewId`
- `environment`
- `alerts` do tripulante ativo
- `regionLevels`
- ações: `loadCrew`, `saveCheckin`, `setEnvironment`, `switchCrew`

`saveCheckin` grava o registro, recalcula a linha de base a partir do histórico, roda o motor e atualiza `alerts`, `correlations` e `regionLevels`.

A sequência completa está em `diagramas/02-fluxo-checkin.md`.

## Convenções

- Um componente por arquivo, com exportação nomeada.
- Cores dos níveis só em `styles/tokens.css`: `--level-green`, `--level-yellow`, `--level-red`.
- `LevelBadge` é o único componente que traduz nível em cor, ícone e texto.
- Datas sempre como texto `AAAA-MM-DD`. Nada de fuso horário.
- Testes cobrem `engine.ts` e `baseline.ts`. Interface não tem teste automático no hackathon.

## Fora do escopo

- Servidor, contas de usuário e sincronização.
- Leitura automática de sensores ou dispositivos.
- Análise de imagem (ultrassom, câmera).
- Envio de resumo para o solo. É uma extensão possível, não faz parte do mínimo.
- Criptografia dos dados locais e bloqueio de sessão. O IndexedDB não criptografa sozinho; num produto real isso seria obrigatório. No protótipo fica declarado como limitação, já que os dados são simulados.
