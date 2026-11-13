/* ============================================================
   ZOO — título de seção
   ============================================================
   <BlurTitle> é o BlurText do React Bits já com o jeito do site: as
   palavras surgem desfocadas, vindas de cima, uma depois da outra. Cada
   item de `lines` vira uma linha do título.

   <SectionHead> é o cabeçalho padrão das seções: título à esquerda e,
   à direita, a nota curta (o que vier como children).
   ============================================================ */

import BlurText from '../reactbits/BlurText.jsx';
import { Reveal } from './Reveal.jsx';

const LINE_BREAK = String.fromCharCode(10);

export function BlurTitle({ lines }) {
  return (
    <BlurText
      as="span"
      text={lines.join(LINE_BREAK)}
      animateBy="words"
      direction="top"
      delay={90}
      stepDuration={0.35}
      blur={10}
      distance={28}
      threshold={0.2}
      rootMargin="0px 0px -60px 0px"
    />
  );
}

export function SectionHead({ lines, children }) {
  return (
    <div className="sec-head">
      <h2>
        <BlurTitle lines={lines} />
      </h2>
      <Reveal as="p" className="note" delay={0.15}>
        {children}
      </Reveal>
    </div>
  );
}
