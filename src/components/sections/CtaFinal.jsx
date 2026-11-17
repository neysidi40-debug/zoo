import ShapeWaves from '../ShapeWaves.jsx';
import { Reveal } from '../Reveal.jsx';
import { BlurTitle } from '../SectionHead.jsx';
import { EMAIL_CONTATO, EMAIL_ORCAMENTO_URL } from '../../data/site.js';

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
          {/* abre o app de email da pessoa, já com o assunto preenchido */}
          <a className="btn" href={EMAIL_ORCAMENTO_URL}>
            Mande um email
          </a>
          <span className="contact-line">{EMAIL_CONTATO}</span>
        </Reveal>
      </div>
    </section>
  );
}
