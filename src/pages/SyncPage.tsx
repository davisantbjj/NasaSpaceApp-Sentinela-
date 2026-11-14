import { useEffect, useState } from 'react';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { ENVIRONMENTS } from '../content/indicators';
import { useNow } from '../hooks/useNow';
import { formatDate, formatDateTime, formatDuration } from '../lib/dates';
import { useAppStore } from '../store/useAppStore';
import { earthLinkStatus } from '../sync/central';
import { packetStatus, transmitOrder } from '../sync/packets';
import type { GroundPacket } from '../types';

const MAX_PACKETS = 15;

// Conexão real do navegador: é por ela que os pacotes vão para a Terra.
function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function Status({ ok, okText, waitText }: { ok: boolean; okText: string; waitText: string }) {
  return (
    <p role="status">
      <strong style={{ color: ok ? 'var(--level-green)' : 'var(--level-yellow)' }}>{ok ? `✓ ${okText}` : `! ${waitText}`}</strong>
    </p>
  );
}

// Fila do aparelho → central de bordo → Terra. Tudo automático: ninguém liga ou desliga nada.
export function SyncPage() {
  const { session, crew, settings, sync, deliverNow } = useAppStore();
  const now = useNow(1000);
  const online = useOnline();
  const earth = earthLinkStatus(); // relido a cada segundo junto com `now`
  const name = (crewId: string) => crew.find((c) => c.id === crewId)?.name ?? crewId;
  const env = ENVIRONMENTS[settings.environment];
  // Só quem cuida da tripulação vê a fila de todos; tripulante e comandante veem só a própria.
  const seesAll = session?.role === 'medicalOfficer';

  const queued = transmitOrder(sync.packets);
  const others = sync.packets
    .filter((p) => p.sentAt)
    .sort((a, b) => b.sentAt!.localeCompare(a.sentAt!));
  const packets: GroundPacket[] = [...queued, ...others].slice(0, MAX_PACKETS);
  const inTransit = sync.packets.some((p) => packetStatus(p, now) === 'inTransit');

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Comunicação</span>
        <h1>Sincronização</h1>
        <p className="muted">
          Tudo acontece sozinho. O check-in vai do aparelho para a central de bordo pela rede da nave, e a central manda um
          pacote por dia para a equipe médica na Terra sempre que há conexão. Sem conexão, os pacotes esperam e saem quando ela
          volta. O alerta nunca espera a Terra: a decisão imediata é de bordo.
        </p>
        {sync.lastRunAt && <p className="small muted num">Última sincronização: {formatDateTime(sync.lastRunAt, true)}</p>}
        {sync.lastError && (
          <p className="notice" role="alert">
            <span className="notice-icon" aria-hidden="true">!</span>
            <span>A última sincronização falhou ({sync.lastError}). Ela é tentada de novo sozinha a cada 5 segundos.</span>
          </p>
        )}
      </header>

      <div className="grid-2">
        <section className="card stack">
          <div>
            <h2>Central de bordo</h2>
            <p className="small muted">Recebe os registros de todos os aparelhos da nave.</p>
          </div>
          <Status ok={sync.outbox.length === 0} okText="Tudo chegou à central" waitText="Enviando para a central" />
          {sync.outbox.length > 0 && (
            <ul className="summary-list">
              {sync.outbox.map((item) => (
                <li key={`${item.kind}_${item.id}`}>
                  <span>
                    {item.kind === 'record' ? 'Check-in' : 'Anotação do oficial médico'}
                    {seesAll && ` · ${name(item.crewId)}`}
                    <span className="muted num"> · {formatDate(item.date, true)}</span>
                  </span>
                  <span className="chip">Na fila</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card stack">
          <div>
            <h2>Ligação com a Terra</h2>
            <p className="small muted">
              Atraso de ida no ambiente atual ({env.label}): {env.signalDelayLabel}. Um alerta vermelho passa na frente da fila.
            </p>
          </div>
          <Status
            ok={online && !earth.lastError}
            okText="Conectada"
            waitText={
              online
                ? 'O servidor da Terra não respondeu. Os pacotes esperam na central e o envio é tentado de novo sozinho'
                : 'Sem conexão. Os pacotes esperam na central e saem sozinhos quando ela voltar'
            }
          />
          <p className="small muted">
            Destino: {earth.name}
            {earth.lastError && online && <> · último erro {formatDateTime(earth.lastErrorAt!, true)}: {earth.lastError}</>}
          </p>
          {inTransit && (
            <div className="row">
              <button type="button" className="btn" onClick={() => void deliverNow()}>Fazer chegar agora (demonstração)</button>
            </div>
          )}
        </section>
      </div>

      <section className="card stack">
        <div>
          <h2>{seesAll ? 'Pacotes para a Terra' : 'Seus pacotes para a Terra'}</h2>
          <p className="small muted">Os mais recentes. Os da fila aparecem primeiro, na ordem em que vão sair.</p>
        </div>
        {packets.length === 0 ? (
          <p className="muted">Nenhum pacote ainda.</p>
        ) : (
          <div className="table-wrap">
            <table className="packets-table">
              <thead>
                <tr><th>Tripulante</th><th>Dia</th><th>Prioridade</th><th>Situação</th></tr>
              </thead>
              <tbody>
                {packets.map((p) => {
                  const status = packetStatus(p, now);
                  return (
                    <tr key={p.id}>
                      <td>{name(p.crewId)}</td>
                      <td>{formatDate(p.date, true)}</td>
                      <td>{p.priority === 'red' ? <LevelBadge level="red" label="Prioridade vermelha" /> : <span className="muted">Normal</span>}</td>
                      <td>
                        {status === 'queued' && <span className="chip">Na fila da central</span>}
                        {status === 'inTransit' && (
                          <span className="chip" style={{ color: 'var(--accent)' }}>
                            A caminho, chega em {formatDuration(Date.parse(p.deliverAt!) - now)}
                          </span>
                        )}
                        {status === 'delivered' && <span className="muted">✓ Chegou {formatDateTime(p.deliverAt!)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
