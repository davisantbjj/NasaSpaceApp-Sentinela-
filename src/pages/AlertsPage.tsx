import { Link } from 'react-router-dom';
import { AlertCard } from '../components/alerts/AlertCard';
import { LevelBadge } from '../components/alerts/LevelBadge';
import { formatDate } from '../lib/dates';
import { currentReview } from '../lib/reviews';
import { useAppStore } from '../store/useAppStore';
import { latestRecord } from './helpers';

export function AlertsPage() {
  const { alerts, correlations, records, reviews, session, reviewAlert } = useAppStore();
  const isMedicalOfficer = session?.role === 'medicalOfficer';
  const latest = latestRecord(records);
  const red = alerts.filter((a) => a.level === 'red').length;
  const yellow = alerts.length - red;

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow">Alertas e ações</span>
        <h1>{alerts.length === 0 ? 'Nenhum alerta' : `${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'} no último registro`}</h1>
        {latest && (
          <p className="muted num">Registro de {formatDate(latest.date)}, dia {latest.missionDay} da missão.</p>
        )}
        {alerts.length > 0 && (
          <div className="row" style={{ marginTop: 6 }}>
            {red > 0 && <LevelBadge level="red" label={`${red} de atenção imediata`} />}
            {yellow > 0 && <LevelBadge level="yellow" label={`${yellow} para acompanhar`} />}
          </div>
        )}
      </header>
      <p><Link to="/medical-contact">Não pode falar? Escreva para mostrar ao oficial médico →</Link></p>

      {alerts.length === 0 ? (
        <section className="card empty">
          {latest && <LevelBadge level="green" />}
          <p className="muted">{latest ? 'Todos os indicadores medidos estão dentro da faixa geral e do padrão pessoal.' : 'Sem registros para avaliar. Faça um check-in para acompanhar os indicadores.'}</p>
          <Link className="link-arrow" to="/">Voltar ao painel →</Link>
        </section>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              review={currentReview(alert, reviews, records)}
              onReview={isMedicalOfficer ? (note) => reviewAlert(alert, note) : undefined}
            />
          ))}
        </div>
      )}

      <section className="card stack">
        <div>
          <h2>Mudaram juntos</h2>
          <p className="small muted">
            Indicadores que se afastaram do esperado nos mesmos dias. Não quer dizer que um causou o outro, e não muda o nível de nenhum alerta.
          </p>
        </div>
        {correlations.length === 0 ? (
          <p className="muted">Nenhum par de indicadores mudou junto nos últimos dias.</p>
        ) : (
          correlations.map((c) => (
            <p key={c.indicators.join('-')} className="notice">
              <span className="notice-icon" aria-hidden="true">≈</span>
              <span>
                {c.description} <span className="muted num">({formatDate(c.fromDate, true)} a {formatDate(c.toDate, true)})</span>
              </span>
            </p>
          ))
        )}
      </section>
    </div>
  );
}
