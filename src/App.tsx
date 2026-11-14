import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Disclaimer } from './components/layout/Disclaimer';
import { NavBar } from './components/layout/NavBar';
import { AlertsPage } from './pages/AlertsPage';
import { CheckinPage } from './pages/CheckinPage';
import { DashboardPage } from './pages/DashboardPage';
import { MissionPage } from './pages/MissionPage';
import { useAppStore } from './store/useAppStore';

// O Recharts é pesado: a tela de gráficos só é baixada quando aberta.
const TrendsPage = lazy(() => import('./pages/TrendsPage').then((m) => ({ default: m.TrendsPage })));

export function App() {
  const { ready, error, crew, settings, alerts, loadCrew, switchCrew } = useAppStore();

  useEffect(() => {
    void loadCrew();
  }, [loadCrew]);

  return (
    <div className="app">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <NavBar
        crew={crew}
        activeCrewId={settings.activeCrewId}
        environment={settings.environment}
        alertCount={alerts.length}
        hasRedAlert={alerts.some((a) => a.level === 'red')}
        onSwitchCrew={(id) => void switchCrew(id)}
      />
      <main className="app-main" id="conteudo" tabIndex={-1}>
        {error ? (
          <div className="card empty">
            <h2>Não foi possível abrir os dados locais</h2>
            <p className="muted">{error}</p>
          </div>
        ) : !ready ? (
          <div className="loading">Carregando dados da tripulação…</div>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* A chave recria o formulário ao trocar de tripulante. */}
            <Route path="/checkin" element={<CheckinPage key={settings.activeCrewId} />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route
              path="/trends/:indicator?"
              element={<Suspense fallback={<div className="loading">Carregando gráficos…</div>}><TrendsPage /></Suspense>}
            />
            <Route path="/mission" element={<MissionPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        )}
      </main>
      <Disclaimer />
    </div>
  );
}
