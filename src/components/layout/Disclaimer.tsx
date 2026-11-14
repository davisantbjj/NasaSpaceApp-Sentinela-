import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export function Disclaimer() {
  // Os atalhos só fazem sentido para tripulantes que entraram (não na tela de entrada nem para o solo).
  const showLinks = useAppStore((s) => !!s.session?.crewId);
  return (
    <footer className="disclaimer">
      <strong>Protótipo, não é dispositivo médico.</strong> Apoio à decisão, sem diagnóstico. Dados da tripulação simulados
      e faixas de demonstração. Equipe CosmoTI · NASA Space Apps Challenge 2026.
      {showLinks && (
        <div className="footer-links"><Link to="/your-data">Seus dados</Link><Link to="/medical-contact">Comunicação por texto</Link></div>
      )}
    </footer>
  );
}
