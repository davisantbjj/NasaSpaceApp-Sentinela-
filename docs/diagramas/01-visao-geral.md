# Diagrama 1: visão geral dos componentes

Mostra as quatro camadas do app e quem chama quem. Tudo roda dentro do navegador; não há servidor.

```mermaid
flowchart TB
    subgraph UI["Apresentação"]
        Dashboard["DashboardPage<br/>corpo humano"]
        Checkin["CheckinPage<br/>formulário diário"]
        AlertsP["AlertsPage<br/>alertas e ações"]
        Trends["TrendsPage<br/>gráficos"]
        Mission["MissionPage<br/>ambiente e lembretes"]
    end

    subgraph State["Estado"]
        Store["useAppStore<br/>tripulante, ambiente,<br/>alertas, níveis por região"]
    end

    subgraph Domain["Domínio"]
        Engine["engine.ts<br/>avalia registros"]
        BaselineM["baseline.ts<br/>linha de base pessoal"]
        RulesJ["rules.json<br/>faixas, textos, fontes"]
        Content["indicators.ts<br/>como e por que medir"]
    end

    subgraph Data["Persistência"]
        Repos["repositórios<br/>records, crew, settings"]
        DB[("IndexedDB<br/>via Dexie")]
        Seed["seed.ts<br/>dados simulados"]
    end

    Dashboard --> Store
    Checkin --> Store
    AlertsP --> Store
    Trends --> Store
    Mission --> Store
    Checkin --> Content
    Dashboard --> Content

    Store --> Engine
    Store --> BaselineM
    Store --> Repos
    Engine --> RulesJ
    BaselineM --> RulesJ

    Repos --> DB
    Seed --> DB
```

## Como ler

- As páginas só falam com o store e com os textos de `content/`.
- O store é o único ponto que junta dados, linha de base e motor de regras.
- O motor de regras não conhece banco nem interface. Recebe dados e devolve alertas.
- `rules.json` é a única fonte de faixas e textos de alerta.
