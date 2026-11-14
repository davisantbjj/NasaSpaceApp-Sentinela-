# Arquitetura

## Visão em camadas

O app tem cinco camadas dentro do navegador e um backend pequeno na Terra.

| Camada | Pastas | O que faz |
| --- | --- | --- |
| Apresentação | `pages/`, `components/`, `hooks/` | Mostra telas e recebe entradas |
| Estado | `store/` | Guarda a sessão, o tripulante ativo, o ambiente, os alertas e o estado da sincronização |
| Domínio | `rules/`, `content/`, `lib/` | Calcula linha de base, níveis e alertas; decide quem vê o quê; cifra e decifra |
| Persistência | `data/` | Lê e grava no IndexedDB, sempre cifrando o dado de saúde |
| Sincronização | `sync/` | Leva os dados do aparelho à central de bordo e da central à Terra |
| Backend na Terra | `server/` | Só guarda e devolve pacotes cifrados |

A nave nunca depende da Terra. "Offline" quer dizer sem a Terra, não sem rede: a nave tem rede interna e uma central de bordo, hoje simulada no navegador.

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
  | 'head' | 'heart' | 'musculoskeletal'
  | 'mind' | 'wholeBody';

export type Environment = 'station' | 'transit' | 'moon' | 'mars';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  missionStart: string;        // data ISO, AAAA-MM-DD
  trackedIndicators: IndicatorId[];   // o check-in só pede estes
  sex?: 'female' | 'male';     // só escolhe a figura do painel; não muda faixa
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
  syncedAt?: string;           // quando chegou à central de bordo; vazio = só no aparelho
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

Tipos de acesso e sincronização:

```ts
export type Role = 'crew' | 'commander' | 'medicalOfficer' | 'groundSurgeon';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  crewId?: string;             // ausente no médico do solo, que não é tripulante
}

export interface Session {     // quem está dentro agora; só em memória
  profileId: string;
  name: string;
  role: Role;
  crewId?: string;
}

export interface AlertReview { // alerta visto pelo oficial médico
  id: string;                  // o mesmo id do alerta
  crewId: string;
  date: string;
  indicator: IndicatorId;
  seenByProfileId: string;
  seenBy: string;
  seenAt: string;
  note: string;                // conduta anotada (cifrada no banco)
  syncedAt?: string;
}

export interface AccessLogEntry { // quem abriu os dados de quem
  id: string;
  subjectCrewId: string;
  actorProfileId: string;
  actorName: string;
  actorRole: Role;
  at: string;
  what: string;                // "Abriu o painel"
}

export interface GroundPacket { // pacote diário da central para a Terra
  id: string;
  crewId: string;
  date: string;
  createdAt: string;
  priority: 'red' | 'normal';  // vermelho passa na frente da fila
  sentAt?: string;
  deliverAt?: string;          // envio + atraso do ambiente
  payload: PacketPayload;      // nome, dia de missão, ambiente, valores, alertas e anotações
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

`levelByRegion` devolve, para cada região do corpo, o pior nível entre os alertas daquela região. É isso que pinta a figura humana. São cinco regiões: mente e sono, olhos e visão, coração e circulação, ossos e músculos, e corpo inteiro. "Corpo inteiro" aparece como selo abaixo da figura (`WholeBodySeal`), não sobre ela.

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

`src/data/db.ts` define dez tabelas no Dexie. As três últimas vieram com a entrega de privacidade da Larissa (v6):

| Tabela | Chave | Índices | O que fica cifrado |
| --- | --- | --- | --- |
| `crew` | `id` | | nada (nome, cargo, indicadores acompanhados) |
| `records` | `id` | `crewId`, `date`, `[crewId+date]` | `values` |
| `settings` | `key` | | nada |
| `profiles` | `id` | | a cópia da chave de dados, cifrada no PIN |
| `reviews` | `id` | `crewId` | `note` |
| `accessLog` | `id` | `subjectCrewId` | nada |
| `packets` | `id` | `crewId` | `payload` |
| `preferences` | `key` | | nada (ex.: versão do aviso de privacidade aceita) |
| `medicalMessages` | `id` | `crewId`, `createdAt` | `body` |
| `deletionRequests` | `id` | `crewId` | nada (pedido local, sem envio) |

`privacyRepo.ts` cuida do aviso, da exportação, do pedido e da exclusão; `messagesRepo.ts` valida e grava as mensagens cifradas. A exportação é montada pelos repositórios, que abrem os dados com a chave da sessão. A exclusão apaga, do tripulante que entrou, check-ins, anotações, mensagens, pedido e pacotes ainda não enviados; o registro de acesso e o perfil fictício ficam. `loadCrew` confere o aviso antes de popular a demonstração. Os limites estão em `docs/privacidade.md`.

Versões do esquema:

- v1: `crew`, `records`, `baselines`, `settings`.
- v2: remove `baselines`.
- v3: o tripulante ganha `sex`.
- v4: cria `profiles`, `reviews`, `accessLog` e `packets`. Os registros antigos estavam abertos, e não dá para cifrá-los dentro da atualização do banco (a Web Crypto é assíncrona). Como são da demonstração, são apagados e recriados.
- v5: a Ana da demonstração vira comandante.
- v6: `preferences`, `medicalMessages` (texto cifrado) e `deletionRequests`, da entrega de privacidade da Larissa.

Alertas, correlações e linhas de base não são gravados. São recalculados a partir dos registros sempre que o app abre, um check-in é salvo ou o tripulante muda. Assim, mudar uma regra atualiza tudo.

Na primeira abertura, `seed.ts` insere três tripulantes fictícios, quatro perfis de entrada e 60 dias de dados. Um deles tem um caso preparado para a demonstração: sono caindo por vários dias, seguido de queda de humor.

## Estado

`useAppStore` (Zustand) guarda:

- `session` (quem entrou)
- `activeCrewId`
- `environment`
- `alerts` do tripulante ativo
- `regionLevels`
- `sync` (fila do aparelho e estado dos pacotes)
- ações: `loadCrew`, `saveCheckin`, `setEnvironment`, `switchCrew`, `lock`, `syncNow`, entre outras

`saveCheckin` grava o registro, recalcula a linha de base a partir do histórico, roda o motor e atualiza `alerts`, `correlations` e `regionLevels`. O alerta aparece na hora, no aparelho. Ele nunca espera a central nem a Terra.

A sequência completa está em `diagramas/02-fluxo-checkin.md`.

## Papéis e acesso

As regras ficam em `src/lib/access.ts`, em funções puras.

| Papel | Na demo | O que vê |
| --- | --- | --- |
| Tripulante (`crew`) | Lia | Só os próprios dados |
| Comandante (`commander`) | Ana | Os próprios dados, como tripulante. Dos outros, só se o check-in de hoje foi feito e se há alerta vermelho (sim ou não). Nada clínico |
| Oficial médico de bordo (`medicalOfficer`) | Kenji | Todos os tripulantes. Marca alertas como vistos e anota a conduta |
| Médico do solo (`groundSurgeon`) | Médico de voo | Só os pacotes que chegaram à Terra. Não abre o painel de ninguém |

- `canViewCrew` diz se o perfil pode abrir o painel de um tripulante.
- `canViewCrewStatus` libera a tela do comandante. `crewStatus` reduz cada tripulante a `checkinToday` e `hasRed`.
- `visibleRecords`: o dono vê tudo o que está no aparelho. Os outros só veem o que já chegou à central (`syncedAt`).
- `visibleReviews`: a anotação aparece para quem escreveu na hora, e para os outros depois que chega à central.

## Sessão

- Entrada por perfil e PIN de 4 a 6 dígitos (`LoginPage`). O campo aceita colar e gerenciador de senhas.
- Depois de 5 PINs errados, o app espera 30 segundos.
- A tela bloqueia depois de 5 minutos sem uso (`hooks/useIdleLock.ts`).
- O menu do avatar tem "Bloquear e trocar de perfil".
- Bloquear ou recarregar a página apaga a chave da memória (`data/keyring.ts`). É preciso digitar o PIN de novo.

## Criptografia

`src/lib/crypto.ts` usa a Web Crypto do navegador.

- Uma chave de dados (AES-GCM, 256 bits) cifra registros, anotações e pacotes.
- Cada perfil guarda uma cópia dessa chave, cifrada com uma chave derivada do PIN (PBKDF2 com SHA-256, 600 mil iterações, sal próprio).
- O PIN não é gravado. Conferir o PIN é abrir a cópia: PIN errado não abre.
- A chave aberta fica só na memória e não pode ser exportada.
- Ficam abertos só os metadados usados para buscar e para a fila: ids, tripulante, datas e prioridade. Valores, alertas e anotações vão no campo `sealed`.

Limite conhecido: um PIN de 4 a 6 dígitos tem no máximo um milhão de combinações. Quem copiar o banco consegue testar todas fora do app. Num produto real, a chave ficaria no hardware do aparelho ou no sistema da agência, não só atrás do PIN.

## Registro de acesso

- Abrir os dados de outra pessoa grava uma linha em `accessLog` (`data/accessLogRepo.ts`).
- Entram no registro: o oficial médico abrindo um painel ou vendo o resumo da tela Tripulação, o comandante vendo o status de check-in e o médico do solo abrindo um pacote.
- O tripulante vê os acessos aos dados dele em "Seus dados" (`PrivacyPage`).
- Enquanto o oficial médico vê outro tripulante, uma faixa fixa avisa que o acesso fica registrado.

## Caminho dos dados

```
aparelho do tripulante ──SyncAdapter──▶ central de bordo ──EarthLink──▶ Terra
```

As duas pontas são interfaces em `src/sync/adapters.ts`. Trocar a implementação não muda as telas.

- `SyncAdapter` leva a fila do aparelho (registros e anotações sem `syncedAt`) até a central. Hoje é a central simulada no navegador (`createLocalCentral`, em `sync/central.ts`). Ao receber, ela marca `syncedAt` e monta o pacote do dia de cada tripulante.
- `EarthLink` manda os pacotes da central para a Terra. Tem duas implementações:
  - `createSimulatedEarthLink`: simulada no navegador.
  - `createHttpEarthLink` (`sync/httpEarthLink.ts`): envia ao backend da equipe. Entra quando `VITE_EARTH_API_URL` está definido.
- As duas usam a conexão real do navegador (`navigator.onLine`). Sem conexão, os pacotes esperam na central.

Sincronização automática:

- Não é opção do usuário. Não há botão de ligar ou desligar.
- Enquanto há sessão, `runSyncCycle` roda a cada 5 segundos.
- Em cada ciclo sai um pacote, para dar para ver o vermelho passar na frente.
- Quando a conexão volta (evento `online`), saem todos os que esperavam, na ordem da fila.
- Se o servidor falhar, o erro aparece na tela Sincronização e os pacotes saem no próximo ciclo.

Prioridade e atraso (`sync/packets.ts`, funções puras):

- `packetPriority`: pacote com alerta vermelho tem prioridade `red`.
- `transmitOrder`: vermelho primeiro, depois o mais antigo.
- `signalDelayMs`: o pacote chega à equipe médica depois do atraso de ida do ambiente (`deliverAt`).

| Ambiente | Atraso na demonstração |
| --- | --- |
| Estação | cerca de 0,24 s |
| Lua | cerca de 1,28 s |
| Trânsito | 2 min (cresce com a distância) |
| Marte | 12 min (de 3 a 22 min na realidade) |

Um pacote está `queued` (na central), `inTransit` (saiu e ainda não chegou) ou `delivered`.

O diagrama está em `diagramas/06-sincronizacao.md`.

## Backend na Terra

Fica em `server/`. Node 24 sem dependências: `node:http` e `node:sqlite`. Uso e publicação estão em `server/README.md`.

- Só guarda e devolve pacotes cifrados. Não tem a chave e não lê dado de saúde.
- Não tem regra de alerta. Alertas e decisões são de bordo.
- Token por missão (`Authorization: Bearer <MISSION_TOKEN>`), CORS por origem e validação de formato.
- Recusa corpo acima de 1 MB e mais de 100 pacotes por envio. Reenviar o mesmo `id` não duplica.

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/health` | Responde `{ "ok": true }`, sem token |
| POST | `/api/packets` | Recebe `{ "packets": [...] }` |
| GET | `/api/packets?since=N` | Pacotes recebidos depois do cursor `N`; devolve `{ packets, cursor }` |
| GET | `/api/crew/:crewId/packets` | Backup de um tripulante (aceita `?since=N`) |

Limites conhecidos:

- O `MISSION_TOKEN` vai junto do app publicado. Só impede gravações de quem não tem o app.
- A equipe médica na Terra precisa da chave de dados para abrir os pacotes. Na demonstração tudo roda num navegador só.
- O app ainda só envia. Buscar pacotes para recuperar dados num aparelho novo fica para depois.

## Convenções

- Um componente por arquivo, com exportação nomeada.
- Cores dos níveis só em `styles/tokens.css`: `--level-green`, `--level-yellow`, `--level-red`.
- `LevelBadge` é o único componente que traduz nível em cor, ícone e texto.
- Datas sempre como texto `AAAA-MM-DD`. Nada de fuso horário.
- Componentes não leem nem gravam dado de saúde sem passar pelos repositórios, que cifram e decifram.
- Testes cobrem o motor de regras, `lib/` (acesso e criptografia), `sync/` e o servidor. Interface não tem teste automático no hackathon.

## Fora do escopo

- Leitura automática de sensores ou dispositivos.
- Análise de imagem (ultrassom, câmera).
- Central de bordo real. Hoje é simulada no navegador, atrás da interface `SyncAdapter`.
- Autenticação da agência. O PIN do protótipo protege a chave, mas num produto real a autenticação seria a da agência.
- Recuperar dados num aparelho novo a partir do backend.
