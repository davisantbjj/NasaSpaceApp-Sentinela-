import { lazy, Suspense, useCallback, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Disclaimer } from './components/layout/Disclaimer';
import { NavBar } from './components/layout/NavBar';
import { useIdleLock } from './hooks/useIdleLock';
import { AlertsPage } from './pages/AlertsPage';
import { CheckinPage } from './pages/CheckinPage';
import { CrewOverviewPage } from './pages/CrewOverviewPage';
import { CrewStatusPage } from './pages/CrewStatusPage';
import { DashboardPage } from './pages/DashboardPage';
import { GroundPage } from './pages/GroundPage';
import { LoginPage } from './pages/LoginPage';
import { MissionPage } from './pages/MissionPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SyncPage } from './pages/SyncPage';
import { useAppStore } from './store/useAppStore';
import type { Role } from './types';

// O Recharts é pesado: a tela de gráficos só é baixada quando aberta.
const TrendsPage = lazy(() => import('./pages/TrendsPage').then((m) => ({ default: m.TrendsPage })));

const IDLE_MS = 5 * 60_000;
const SYNC_EVERY_MS = 5_000;

function OnBoardRoutes({ activeCrewId, role }: { activeCrewId: string; role: Role }) {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      {/* A chave recria o formulário ao trocar de tripulante. */}
      <Route path="/checkin" element={<CheckinPage key={activeCrewId} />} />
      <Route path="/alerts" element={<AlertsPage />} />
      <Route
        path="/trends/:indicator?"
        element={<Suspense fallback={<div className="loading">Carregando gráficos…</div>}><TrendsPage /></Suspense>}
      />
      <Route path="/mission" element={<MissionPage />} />
      <Route path="/sync" element={<SyncPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      {role === 'medicalOfficer' && <Route path="/crew" element={<CrewOverviewPage />} />}
      {role === 'commander' && <Route path="/crew" element={<CrewStatusPage />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function GroundRoutes() {
  return (
    <Routes>
      <Route path="/ground/:crewId?" element={<GroundPage />} />
      <Route path="*" element={<Navigate to="/ground" replace />} />
    </Routes>
  );
}

// Aviso fixo quando o oficial médico está vendo os dados de outro tripulante.
function ViewingBanner() {
  const { session, crew, settings, switchCrew } = useAppStore();
  if (!session || session.role !== 'medicalOfficer' || settings.activeCrewId === session.crewId) return null;
  const member = crew.find((c) => c.id === settings.activeCrewId);
  if (!member) return null;
  return (
    <p className="notice viewing-banner" role="status">
      <span className="notice-icon" aria-hidden="true">👁</span>
      <span>
        Você está vendo os dados de <strong>{member.name}</strong> como oficial médico. Este acesso fica registrado,
        e {member.name.split(' ')[0]} pode ver o registro.
      </span>
      {session.crewId && (
        <button type="button" className="btn btn-ghost" onClick={() => void switchCrew(session.crewId!)}>Voltar aos meus dados</button>
      )}
    </p>
  );
}

export function App() {
  const { ready, error, session, crew, settings, alerts, sync, loadCrew, switchCrew, lock, syncNow } = useAppStore();

  useEffect(() => {
    void loadCrew();
  }, [loadCrew]);

  // Bloqueio por inatividade.
  const lockIdle = useCallback(() => lock('A tela foi bloqueada depois de 5 minutos sem uso.'), [lock]);
  useIdleLock(!!session, IDLE_MS, lockIdle);

  // Sincronização em segundo plano enquanto alguém está dentro.
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => void syncNow(), SYNC_EVERY_MS);
    // A conexão voltou: manda tudo o que esperava, na ordem da fila.
    const onOnline = () => void syncNow(true);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [session, syncNow]);

  return (
    <div className="app">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      {session && (
        <NavBar
          session={session}
          crew={crew}
          activeCrewId={settings.activeCrewId}
          environment={settings.environment}
          alertCount={session.role === 'groundSurgeon' ? 0 : alerts.length}
          hasRedAlert={alerts.some((a) => a.level === 'red')}
          pendingSync={sync.outbox.length}
          onSwitchCrew={(id) => void switchCrew(id)}
          onLock={() => lock()}
        />
      )}
      <main className="app-main" id="conteudo" tabIndex={-1}>
        {error ? (
          <div className="card empty">
            <h2>Não foi possível abrir os dados locais</h2>
            <p className="muted">{error}</p>
          </div>
        ) : !ready ? (
          <div className="loading">Preparando os dados da tripulação…</div>
        ) : !session ? (
          <LoginPage />
        ) : session.role === 'groundSurgeon' ? (
          <GroundRoutes />
        ) : (
          <>
            <ViewingBanner />
            <OnBoardRoutes activeCrewId={settings.activeCrewId} role={session.role} />
          </>
        )}
      </main>
      <Disclaimer />
    </div>
  );
}
