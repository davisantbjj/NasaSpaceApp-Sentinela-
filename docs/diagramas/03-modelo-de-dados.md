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
        json values
        string createdAt
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
| `DAILY_RECORD` | IndexedDB, tabela `records` | Um por tripulante por dia |
| `BASELINE` | Só em memória, no store | Recalculada a partir dos registros; uma por tripulante por série numérica |
| `SETTINGS` | IndexedDB, tabela `settings` | Registro único |
| `RULE` | Arquivo `src/rules/rules.json` | Não vai para o banco |
| `ALERT` | Só em memória, no store | Recalculado a partir dos registros |
| `CORRELATION` | Só em memória, no store | Recalculada junto com os alertas; não muda nível |
| `MEDICAL_MESSAGE` | IndexedDB, tabela `medicalMessages` | Texto por perfil, sem entrega |
| `DELETION_REQUEST` | IndexedDB, tabela `deletionRequests` | Uma solicitação local por perfil |
| `PREFERENCE` | IndexedDB, tabela `preferences` | Leitura versionada do aviso; preservada no reset |
