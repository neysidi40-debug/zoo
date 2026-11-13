/* O que vem junto do site. O check de cada item se desenha depois que a
   linha entra (o traço é CSS: espera a classe is-visible do <Reveal>). */

import { Reveal, stagger } from '../Reveal.jsx';
import { BlurTitle } from '../SectionHead.jsx';
import { Mark } from '../Ink.jsx';

const ITEMS = [
  'Site responsivo (celular, tablet e computador)',
  'Domínio e hospedagem configurados',
  'Otimização básica para o Google (SEO)',
  'Botão de WhatsApp integrado',
  'Treinamento para você mesmo atualizar o site',
  <Mark key="suporte">30 dias de suporte após o lançamento</Mark>
];

export default function Deliverables() {
  return (
    <section className="panel-band">
      <div className="wrap deliverables">
        <div>
          <h2>
            <BlurTitle lines={['O que vem', 'junto do site']} />
          </h2>
          <Reveal as="p" delay={0.12}>
            Nenhum projeto sai da nossa mão sem isso — <Mark>faz parte do preço</Mark>, não é upgrade escondido no
            contrato.
          </Reveal>
        </div>
        <ul className="check-list">
          {ITEMS.map((item, index) => (
            <Reveal as="li" key={index} delay={stagger(index)}>
              <span className="check-box">
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path pathLength="1" d="M2.5 6.2l2.4 2.4 4.6-5" />
                </svg>
              </span>
              <span>{item}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
