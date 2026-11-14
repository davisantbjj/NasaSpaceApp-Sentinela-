# Diagrama 3: modelo de dados

Mostra as entidades e como se relacionam. Os tipos completos estão em `docs/arquitetura.md`.

```mermaid
erDiagram
    CREW_MEMBER ||--o{ DAILY_RECORD : registra
    CREW_MEMBER ||--o{ BASELINE : possui
    CREW_MEMBER ||--o{ CORRELATION : apresenta
    CREW_MEMBER ||--o{ MEDICAL_MESSAGE : escreve
    CREW_MEMBER ||--o| DELETION_REQUEST : solicita
    DAILY_RECORD ||--o{ ALERT : gera
    RULE ||--o{ ALERT : justifica
    SETTINGS ||--|| CREW_MEMBER : "tripulante ativo"
    PROFILE |o--o| CREW_MEMBER : "entra como"
    ALERT ||--o| ALERT_REVIEW : "visto pelo oficial médico"
    PROFILE ||--o{ ALERT_REVIEW : escreve
    PROFILE ||--o{ ACCESS_LOG_ENTRY : "abre dados"
    CREW_MEMBER ||--o{ ACCESS_LOG_ENTRY : "tem dados abertos"
    DAILY_RECORD ||--o| GROUND_PACKET : "vira pacote do dia"
    CREW_MEMBER ||--o{ GROUND_PACKET : envia

    CREW_MEMBER {
        string id PK
        string name
        string role
        string sex
        string missionStart
        json trackedIndicators
    }

    DAILY_RECORD {
        string id PK
        string crewId FK
        string date
        int missionDay
        json values "cifrado"
        string createdAt
        string syncedAt "chegada à central"
    }

    PROFILE {
        string id PK
        string name
        string role "crew, commander, medicalOfficer, groundSurgeon"
        string crewId FK "ausente no médico do solo"
        bytes salt
        json crewKeys "chaves dos tripulantes que o perfil abre, cifradas no PIN"
    }

    ALERT_REVIEW {
        string id PK "o mesmo id do alerta"
        string crewId FK
        string date
        string indicator
        string seenByProfileId FK
        string seenBy
        string seenAt
        string note "cifrado"
        string syncedAt
    }

    ACCESS_LOG_ENTRY {
        string id PK
        string subjectCrewId FK
        string actorProfileId FK
        string actorName
        string actorRole
        string at
        string what
    }

    GROUND_PACKET {
        string id PK
        string crewId FK
        string date
        string createdAt
        string priority "red ou normal"
        string sentAt
        string deliverAt "envio + atraso do ambiente"
        json payload "cifrado"
    }

    BASELINE {
        string crewId FK
        string indicator
        float mean
        int sampleDays
        int excludedDays
    }

    CORRELATION {
        string crewId
        json indicators
        string fromDate
        string toDate
        string description
    }

    ALERT {
        string id
        string crewId
        string date
        string indicator
        string region
        string level
        string trigger
        string reference
        string whatToDo
        string confidence
        boolean notifyGround
        string sourceUrl
    }

    RULE {
        string indicator PK
        string region
        string unit
        json green
        json yellow
        boolean useBaseline
        string sourceUrl
    }

    SETTINGS {
        string environment
        string activeCrewId
        json reminders
    }

    MEDICAL_MESSAGE {
        string id PK
        string crewId FK
        string body
        string createdAt
        string status "local, sem envio"
    }

    DELETION_REQUEST {
        string id PK
        string crewId FK
        string createdAt
        string status "pending, sem envio"
    }

    PREFERENCE {
        string key PK
        string value "versão do aviso lido"
    }
```

## Onde cada entidade vive

| Entidade | Onde fica | Observação |
| --- | --- | --- |
| `CREW_MEMBER` | IndexedDB, tabela `crew` | Três tripulantes fictícios vindos do `seed.ts` |
| `DAILY_RECORD` | IndexedDB, tabela `records` | Um por tripulante por dia. `values` cifrado; `syncedAt` marca a chegada à central |
| `PROFILE` | IndexedDB, tabela `profiles` | Quatro perfis na demo. Guarda, cifradas no PIN, só as chaves que o perfil pode abrir; o PIN não é gravado |
| `ALERT_REVIEW` | IndexedDB, tabela `reviews` | Alerta visto pelo oficial médico. A conduta (`note`) fica cifrada |
| `ACCESS_LOG_ENTRY` | IndexedDB, tabela `accessLog` | Quem abriu os dados de quem. O tripulante vê em "Seus dados" |
| `GROUND_PACKET` | IndexedDB, tabela `packets`; cópia no backend da Terra | Um por tripulante por dia. `payload` cifrado; o servidor guarda sem abrir |
| `BASELINE` | Só em memória, no store | Recalculada a partir dos registros; uma por tripulante por série numérica |
| `SETTINGS` | IndexedDB, tabela `settings` | Registro único |
| `RULE` | Arquivo `src/rules/rules.json` | Não vai para o banco |
| `ALERT` | Só em memória, no store | Recalculado a partir dos registros |
| `CORRELATION` | Só em memória, no store | Recalculada junto com os alertas; não muda nível |
| `Session` | Só em memória, no store | Quem entrou. Some ao bloquear ou recarregar, junto com a chave |
| `MEDICAL_MESSAGE` | IndexedDB, tabela `medicalMessages` | Texto cifrado por perfil, sem entrega |
| `DELETION_REQUEST` | IndexedDB, tabela `deletionRequests` | Uma solicitação local por perfil |
| `PREFERENCE` | IndexedDB, tabela `preferences` | Leitura versionada do aviso; preservada no reset |

Ficam abertos no banco só os metadados usados para buscar e para a fila: ids, tripulante, datas e prioridade.
