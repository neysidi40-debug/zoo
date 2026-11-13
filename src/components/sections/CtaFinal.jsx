import ShapeWaves from '../ShapeWaves.jsx';
import { Reveal } from '../Reveal.jsx';
import { BlurTitle } from '../SectionHead.jsx';
import { EMAIL_CONTATO, WHATSAPP_QUOTE_URL } from '../../data/site.js';

export default function CtaFinal() {
  return (
    <section className="cta-final" id="contato">
      {/* fundo de ondas de formas que seguem o mouse */}
      <ShapeWaves className="cta-waves" />
      <div className="wrap">
        <h2>
          <BlurTitle lines={['Vamos construir', 'o site do seu negócio.']} />
        </h2>
        <Reveal className="side" delay={0.2}>
          <a className="btn" href={WHATSAPP_QUOTE_URL} target="_blank" rel="noopener">
            Chamar no WhatsApp
          </a>
          <span className="contact-line">{EMAIL_CONTATO}</span>
        </Reveal>
      </div>
    </section>
  );
}
