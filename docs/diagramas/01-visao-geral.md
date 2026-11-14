# Diagrama 1: visão geral dos componentes

Mostra as camadas do app, a central de bordo, a Terra e quem chama quem. O app roda inteiro no navegador. O único servidor é o backend na Terra, que só guarda pacotes cifrados; a nave nunca depende dele.

```mermaid
flowchart TB
    subgraph Roles["Papéis"]
        Crew(["Tripulante<br/>só os próprios dados"])
        Cmd(["Comandante<br/>próprios dados + check-in<br/>e vermelho dos outros"])
        MO(["Oficial médico de bordo<br/>todos os tripulantes"])
        GS(["Médico do solo<br/>só pacotes na Terra"])
    end

    subgraph Device["Aparelho do tripulante (navegador)"]
        subgraph UI["Apresentação"]
            Login["LoginPage<br/>perfil + PIN"]
            Dashboard["DashboardPage<br/>corpo humano"]
            Checkin["CheckinPage<br/>formulário diário"]
            AlertsP["AlertsPage<br/>alertas e ações"]
            Trends["TrendsPage<br/>gráficos"]
            Mission["MissionPage<br/>ambiente e lembretes"]
            CrewP["CrewOverviewPage /<br/>CrewStatusPage"]
            SyncP["SyncPage<br/>estado da sincronização"]
            Privacy["YourDataPage<br/>cópia, pedido de exclusão<br/>e registro de acesso"]
        end

        subgraph State["Estado"]
            Store["useAppStore<br/>sessão, tripulante, ambiente,<br/>alertas, níveis, sincronização"]
        end

        subgraph Domain["Domínio"]
            Engine["engine.ts<br/>avalia registros"]
            BaselineM["baseline.ts<br/>linha de base pessoal"]
            RulesJ["rules.json<br/>faixas, textos, fontes"]
            Access["access.ts<br/>quem vê o quê"]
            Crypto["crypto.ts<br/>AES-GCM + PIN"]
        end

        subgraph Data["Persistência"]
            Repos["repositórios<br/>records, crew, settings, profiles,<br/>reviews, accessLog, packets"]
            DB[("IndexedDB<br/>via Dexie, cifrado")]
        end

        subgraph Sync["Sincronização"]
            Cycle["runSyncCycle<br/>a cada 5 s"]
        end
    end

    Central["Central de bordo<br/>(simulada no navegador)<br/>SyncAdapter"]
    Link["Ligação com a Terra<br/>EarthLink<br/>vermelho primeiro, com atraso"]
    Server["Backend na Terra<br/>server/<br/>só pacotes cifrados"]
    Ground["GroundPage<br/>Visão do solo"]

    Crew --> Login
    Cmd --> Login
    MO --> Login
    GS --> Login

    Login --> Store
    Dashboard --> Store
    Checkin --> Store
    AlertsP --> Store
    Trends --> Store
    Mission --> Store
    CrewP --> Store
    SyncP --> Store
    Privacy --> Store

    Store --> Engine
    Store --> BaselineM
    Store --> Access
    Store --> Repos
    Store --> Cycle
    Engine --> RulesJ
    BaselineM --> RulesJ
    Repos --> Crypto
    Repos --> DB

    Cycle --> Central
    Central --> Link
    Link -- "com VITE_EARTH_API_URL" --> Server
    Link --> Ground
    Server -.-> Ground
```

## Como ler

- Todos os papéis entram pela mesma tela, com perfil e PIN. O papel decide as telas.
- As páginas só falam com o store e com os textos de `content/`.
- O store é o único ponto que junta sessão, dados, linha de base, motor de regras e sincronização.
- O motor de regras não conhece banco nem interface. Recebe dados e devolve alertas.
- Os repositórios cifram e decifram. Nada de saúde fica aberto no IndexedDB.
- O alerta sai no aparelho, na hora. A central e a Terra recebem depois.
- Sem `VITE_EARTH_API_URL`, a ligação com a Terra é simulada no navegador. Com ele, os pacotes vão ao backend.
- O médico do solo só vê pacotes que chegaram, depois do atraso do ambiente.
