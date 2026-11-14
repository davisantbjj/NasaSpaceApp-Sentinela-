# Diagrama 4: níveis de alerta

Mostra como o motor de regras decide o nível de um indicador num dia.

## Decisão para um indicador

```mermaid
flowchart TD
    Start(["Valor do indicador no dia"]) --> Range{"Dentro da<br/>faixa verde?"}

    Range -- sim --> HasBase{"Usa linha de base<br/>e ela já existe?"}
    Range -- não --> Yellow{"Dentro da<br/>faixa amarela?"}

    Yellow -- sim --> LY["Nível: amarelo"]
    Yellow -- não --> LR["Nível: vermelho"]

    HasBase -- não --> LG["Nível: verde"]
    HasBase -- sim --> Dev{"Desvio acima do limite<br/>por 3 dias seguidos?"}

    Dev -- não --> LG
    Dev -- sim --> LY

    LG --> Out(["Nível final"])
    LY --> Alert["Monta o alerta:<br/>referência usada, confiança,<br/>nota do ambiente, fonte"]
    LR --> Alert
    Alert --> Out
```

Os valores "3 dias" e o limite de desvio (15%) vêm de `config` em `rules.json` e são de demonstração.

O ambiente da missão não aparece na decisão. Ele só acrescenta uma nota de texto ao alerta.

A linha de base nunca melhora um nível: um valor fora da faixa geral é amarelo ou vermelho mesmo que seja comum para aquela pessoa.

## O que cada nível significa

```mermaid
stateDiagram-v2
    [*] --> Verde
    Verde --> Amarelo: fora da faixa verde ou desvio pessoal mantido
    Amarelo --> Vermelho: fora da faixa amarela
    Amarelo --> Verde: valor volta ao normal
    Vermelho --> Amarelo: valor melhora
    Vermelho --> Verde: valor volta ao normal
    Verde --> Vermelho: valor muito fora da faixa
```

| Nível | Significado | O que o app faz |
| --- | --- | --- |
| Verde | Dentro do esperado | Mostra o valor e a tendência |
| Amarelo | Merece acompanhamento | Cria alerta com ação sugerida e pede nova medida |
| Vermelho | Pede atenção imediata | Cria alerta, indica chamar o médico de bordo e marca aviso ao solo |

## Da regra ao corpo humano

Cada indicador pertence a uma região do corpo. A cor da região é o pior nível entre os indicadores dela.

| Região | Indicadores |
| --- | --- |
| `head` | `vision` |
| `heart` | `bloodPressure`, `heartRate` |
| `musculoskeletal` | `exerciseMinutes` |
| `immune` | `temperature` |
| `metabolism` | `glucose` |
| `mind` | `sleepHours`, `mood` |
| `wholeBody` | `radiationDose`, `symptoms` |
