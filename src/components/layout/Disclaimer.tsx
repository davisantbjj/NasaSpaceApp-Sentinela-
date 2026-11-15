import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import i18n from '../../i18n';

export function Disclaimer() {
  // Os atalhos só fazem sentido para tripulantes que entraram (não na tela de entrada nem para o solo).
  const showLinks = useAppStore((s) => !!s.session?.crewId);
  return (
    <footer className="disclaimer">
      <strong>{i18n.t('disclaimer.lead')}</strong>{` ${i18n.t('disclaimer.details')}`}
      {showLinks && (
        <div className="footer-links"><Link to="/your-data">{i18n.t('disclaimer.yourData')}</Link><Link to="/medical-contact">{i18n.t('disclaimer.contact')}</Link></div>
      )}
    </footer>
  );
}
