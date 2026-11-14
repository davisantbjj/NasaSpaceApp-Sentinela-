# Diagrama 6: sincronização do check-in até a Terra

Mostra o caminho de um check-in com alerta vermelho: aparelho, central de bordo, Terra. Inclui uma queda de conexão no meio. Os detalhes estão em `docs/arquitetura.md`, seção "Caminho dos dados".

```mermaid
sequenceDiagram
    actor T as Tripulante
    participant App as Aparelho<br/>(store + IndexedDB)
    participant C as Central de bordo<br/>(SyncAdapter, simulada)
    participant L as Ligação com a Terra<br/>(EarthLink)
    participant S as Backend na Terra<br/>(server/)
    actor M as Médico do solo

    T->>App: salva o check-in
    App->>App: grava o registro cifrado, sem syncedAt
    App-->>T: alerta vermelho na hora<br/>(não espera a central nem a Terra)

    Note over App,C: a cada 5 s, sozinho (runSyncCycle)
    App->>C: push(fila do aparelho)
    C->>C: marca syncedAt
    C->>C: monta o pacote do dia, cifrado<br/>prioridade red
    C->>C: transmitOrder: vermelho na frente

    Note over L: conexão cai (navigator.onLine falso)
    App->>L: isOpen()?
    L-->>App: não
    Note over C: pacotes esperam na central

    Note over L: conexão volta (evento online)
    App->>L: send(todos os que esperavam, na ordem da fila)
    alt com VITE_EARTH_API_URL
        L->>S: POST /api/packets (Bearer token, conteúdo cifrado)
        alt servidor responde
            S-->>L: ok (mesmo id não duplica)
            L->>App: grava sentAt e deliverAt
        else servidor fora do ar
            S--xL: erro ou tempo esgotado
            L-->>App: erro na tela Sincronização
            Note over C: pacotes continuam na fila e saem no próximo ciclo
        end
    else sem backend
        L->>App: grava sentAt e deliverAt (simulado)
    end

    Note over L,M: deliverAt = envio + atraso do ambiente<br/>(estação 0,24 s; Marte 12 min na demo)
    M->>App: abre a Visão do solo
    App-->>M: só pacotes com deliverAt já passado
    App->>App: grava no registro de acesso
```

## Como ler

- O alerta é de bordo. Ele aparece no aparelho antes de qualquer envio.
- Ninguém liga ou desliga a sincronização. Ela roda sozinha enquanto há sessão.
- Em cada ciclo normal sai um pacote. Assim dá para ver o vermelho passar na frente.
- Quando a conexão volta, saem todos os pacotes que esperavam.
- O backend só guarda o pacote cifrado. Ele não abre e não decide nada.
- O médico do solo vê o pacote só depois do atraso do ambiente. A tela avisa que a decisão imediata é de bordo.
