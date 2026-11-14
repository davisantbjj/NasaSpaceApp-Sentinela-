import { Link } from 'react-router-dom';

export function Disclaimer() {
  return (
    <footer className="disclaimer">
      <strong>Protótipo, não é dispositivo médico.</strong> Apoio à decisão, sem diagnóstico. Dados da tripulação simulados
      e faixas de demonstração. Equipe CosmoTI · NASA Space Apps Challenge 2026.
      <div className="footer-links"><Link to="/your-data">Seus dados</Link><Link to="/medical-contact">Comunicação por texto</Link></div>
    </footer>
  );
}
