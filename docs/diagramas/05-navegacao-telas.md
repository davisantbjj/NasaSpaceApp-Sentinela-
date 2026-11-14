# Diagrama 5: navegação entre telas

Mostra as cinco telas principais e os fluxos adicionais de privacidade e comunicação.

```mermaid
flowchart LR
    Open(["Abrir o app"]) --> Notice{"Aviso atual já lido?"}
    Notice -- não --> Privacy["Aviso de privacidade"]
    Privacy -- "registrar leitura" --> First
    Notice -- sim --> First{"Primeira vez?"}
    First -- sim --> SeedStep["Carrega dados simulados"]
    SeedStep --> Dash
    First -- não --> Dash

    Dash["Painel<br/>/"]
    Check["Check-in diário<br/>/checkin"]
    Alerts["Alertas e ações<br/>/alerts"]
    Trends["Tendências<br/>/trends/:indicator"]
    Mission["Missão e rotina<br/>/mission"]
    Data["Seus dados<br/>/your-data"]
    Message["Comunicação por texto<br/>/medical-contact"]
    Region["Detalhe da região<br/>painel lateral"]

    Dash -- "clicar numa região" --> Region
    Region -- "ver alerta" --> Alerts
    Region -- "ver histórico" --> Trends
    Dash -- "check-in pendente" --> Check
    Check -- "salvar" --> Dash
    Check -- "alerta novo" --> Alerts
    Alerts -- "ver histórico" --> Trends
    Dash --> Mission
    Mission -- "trocar ambiente" --> Dash
    Mission --> Data
    Mission --> Message
    Alerts --> Message
    Message --> Data
    Data -- "excluir histórico confirmado" --> Dash
```

## Rotas

| Rota | Página | Prioridade |
| --- | --- | --- |
| `/` | `DashboardPage` | Essencial |
| `/checkin` | `CheckinPage` | Essencial |
| `/alerts` | `AlertsPage` | Essencial |
| `/trends/:indicator` | `TrendsPage` | Desejável |
| `/mission` | `MissionPage` | Desejável |
| `/your-data` | `YourDataPage` | Privacidade local |
| `/medical-contact` | `MedicalContactPage` | Texto salvo para mostrar à equipe, sem envio |

## Elementos fixos em todas as telas

- Barra de navegação com as cinco telas.
- Seletor de tripulante.
- Indicador do ambiente atual (estação, trânsito, Lua ou Marte).
- Rodapé com o aviso de protótipo.
- Links de privacidade e comunicação no rodapé. Antes da leitura do aviso, os links também mostram o aviso, sem liberar formulários.

## Passos do check-in

O check-in mostra um indicador por passo, nesta ordem: pressão arterial, frequência cardíaca, temperatura, glicemia, sono, humor, exercício, radiação, visão, sintomas. Só aparecem os indicadores que o tripulante acompanha. Cada passo tem o campo de entrada, "como medir" e "por que medir". Qualquer passo pode ser pulado.

## O que a tela de alertas mostra em cada alerta

O que mudou, em relação a qual referência, por que importa, o que fazer, nota do ambiente, confiança do dado e fonte. Abaixo dos alertas, uma seção "Mudaram juntos" lista as correlações, sem dizer que uma causou a outra.
