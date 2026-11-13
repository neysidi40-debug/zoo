import KoalaIcon from './KoalaIcon.jsx';
import { CIDADE, CNPJ, EMAIL_SUPORTE, NAV, WHATSAPP_URL } from '../data/site.js';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="logo">
            <KoalaIcon size={30} />
            <h3>ZOO</h3>
          </div>
          <div className="foot-links">
            <div className="foot-col">
              <strong>Navegação</strong>
              {NAV.filter(item => item.id !== 'contato').map(item => (
                <a key={item.id} href={`#${item.id}`}>
                  {item.label}
                </a>
              ))}
            </div>
            <div className="foot-col">
              <strong>Contato</strong>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                WhatsApp
              </a>
              <a href={`mailto:${EMAIL_SUPORTE}`}>{EMAIL_SUPORTE}</a>
            </div>
            <div className="foot-col">
              <strong>Base</strong>
              <span>{CIDADE}</span>
              <span>CNPJ {CNPJ}</span>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 ZOO. Todos os direitos reservados.</span>
          <span className="mono">SITES PROJETADOS SOB MEDIDA, DA IDEIA AO LANÇAMENTO</span>
        </div>
      </div>
    </footer>
  );
}
