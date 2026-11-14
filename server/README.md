# Sentinela: backend na Terra

Servidor pequeno que **só guarda e devolve pacotes cifrados**. A central de bordo manda um pacote por dia para cada tripulante; se a tripulação ficar muito tempo sem comunicação, os dados continuam guardados aqui quando a rede volta.

- O servidor **não tem a chave** e não consegue ler nenhum dado de saúde. O conteúdo chega cifrado (AES-GCM) do app e é guardado como veio.
- A nave **nunca depende dele**: alertas e decisões são de bordo. Se o servidor cair, os pacotes esperam na central e saem sozinhos quando ele voltar.
- Sem dependências: usa só `node:http` e o SQLite embutido no Node (`node:sqlite`). Precisa de **Node 24**.

## Rotas

Todas em JSON, com o cabeçalho `Authorization: Bearer <token>`, menos `health`:

- **Enviar** (POST) usa o `MISSION_TOKEN`. Ele vai junto do app publicado, então não é segredo forte.
- **Ler** (GET) usa o `READ_TOKEN`, que fica só com a equipe médica na Terra. Assim, quem tem o app consegue enviar, mas não descobre nem os metadados dos pacotes (quem, quando, prioridade vermelha).

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/health` | Responde `{ "ok": true }`. Para o Railway saber se está de pé |
| POST | `/api/packets` | Recebe `{ "packets": [...] }` (até 100). Reenviar o mesmo `id` não duplica |
| GET | `/api/packets?since=N` | Pacotes recebidos depois do cursor `N`. Devolve `{ packets, cursor }`; guarde o `cursor` para a próxima busca |
| GET | `/api/crew/:crewId/packets` | Backup de um tripulante (aceita `?since=N`) |

Formato de um pacote:

```json
{
  "id": "ana_2026-11-14_2026-11-14T18:07:43.747Z",
  "crewId": "ana",
  "date": "2026-11-14",
  "createdAt": "2026-11-14T18:07:43.747Z",
  "sentAt": "2026-11-14T18:07:44.010Z",
  "priority": "red",
  "sealed": { "iv": "<base64>", "data": "<base64>" }
}
```

O servidor recusa o que foge disso (campos inválidos, corpo acima de 1 MB, mais de 100 pacotes por envio).

## Rodar no computador

```bash
cd server
MISSION_TOKEN=um-token-com-16-caracteres-ou-mais READ_TOKEN=outro-token-com-16-caracteres npm run dev
```

No PowerShell:

```powershell
cd server
$env:MISSION_TOKEN = "um-token-com-16-caracteres-ou-mais"; $env:READ_TOKEN = "outro-token-com-16-caracteres"; npm run dev
```

Testes: `npm test`.

Para o app usar o servidor, crie `.env.local` na raiz do projeto (não vai para o Git):

```
VITE_EARTH_API_URL=http://localhost:8787
VITE_EARTH_MISSION_TOKEN=um-token-com-16-caracteres-ou-mais
```

Sem `VITE_EARTH_API_URL`, o app usa a ligação com a Terra simulada no navegador.

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `MISSION_TOKEN` | Sim | Token que o app manda ao enviar. Pelo menos 16 caracteres |
| `READ_TOKEN` | Sim | Token para ler os pacotes. Diferente do `MISSION_TOKEN`, pelo menos 16 caracteres, nunca vai para o app |
| `ALLOWED_ORIGINS` | Em produção | Endereços do app publicados, separados por vírgula (ex.: `https://sentinela.vercel.app`). Padrão: `localhost:5173` e `localhost:4173` |
| `DATA_DIR` | Em produção | Pasta do banco. No Railway, o caminho do volume (`/data`) |
| `PORT` | Não | O Railway define sozinho. Padrão: 8787 |

## Publicar no Railway

1. No Railway, **New Project → Deploy from GitHub repo** e escolha este repositório.
2. Em **Settings → Source**, defina **Root Directory** como `server`.
3. Em **Settings → Deploy**, o comando de start é `npm start` (já é o padrão) e o healthcheck é `/api/health`.
4. **Crie um volume** (botão direito no serviço → Attach volume) montado em `/data`. Sem volume, o banco é apagado a cada nova versão publicada.
5. Em **Variables**: `MISSION_TOKEN` e `READ_TOKEN` (gere dois aleatórios e diferentes), `DATA_DIR=/data` e `ALLOWED_ORIGINS` com o endereço do app publicado.
6. Em **Settings → Networking**, gere um domínio público e use esse endereço em `VITE_EARTH_API_URL` no deploy do app (Vercel: Project → Settings → Environment Variables).

## Limites conhecidos (protótipo)

- O `MISSION_TOKEN` vai junto do app publicado, então não é segredo de verdade: só impede gravações de quem não tem o app. Num produto real cada aparelho teria a própria credencial.
- Os metadados (tripulante, data, prioridade) ficam abertos no servidor, protegidos só pelo `READ_TOKEN`. O conteúdo de saúde fica sempre cifrado.
- A equipe médica na Terra precisa da chave de dados para abrir os pacotes. Na demonstração tudo roda num navegador só e a chave já está lá. Num produto real, a distribuição dessa chave seria do sistema da agência.
- O app ainda não busca pacotes do servidor (só envia). A rota de busca já existe, para recuperar dados num aparelho novo.
