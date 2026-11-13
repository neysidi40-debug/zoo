/* ============================================================
   ZOO — marca-texto e sublinhado
   ============================================================
   <Mark> passa a "caneta" laranja no trecho; <Uline> é a versão
   minimalista, um sublinhado de 2px. Usados nos trechos que mais pesam
   na decisão de quem está pensando em contratar: resultado, prazo,
   preço sem surpresa, posse do site e suporte.

   O traço só entra DEPOIS que o bloco termina de surgir (pra não
   competir com a entrada), e marcas do mesmo bloco entram em sequência.
   Quem diz quando o bloco surgiu é o RevealContext (ver Reveal.jsx).
   O desenho em si é CSS: aqui só se liga a classe is-inked.
   ============================================================ */

import { useContext, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { RevealContext } from './Reveal.jsx';

const BREATH = 160; // respiro entre o fim do surgimento e a caneta
const STAGGER = 150; // atraso entre marcas do mesmo bloco

function Ink({ as: Tag, className, children }) {
  const ref = useRef(null);
  const { shown, settleMs } = useContext(RevealContext);
  const reduce = useReducedMotion();
  const [inked, setInked] = useState(false);

  useEffect(() => {
    if (!shown) {
      setInked(false);
      return undefined;
    }
    if (reduce) {
      setInked(true);
      return undefined;
    }
    // posição desta marca dentro do bloco, pra escalonar
    const host = ref.current?.closest('[data-ink-host]');
    const marks = host ? Array.from(host.querySelectorAll('mark.ink, .uline')) : [];
    const index = Math.max(0, marks.indexOf(ref.current));
    const timer = setTimeout(() => setInked(true), settleMs + BREATH + index * STAGGER);
    return () => clearTimeout(timer);
  }, [shown, settleMs, reduce]);

  return (
    <Tag ref={ref} className={`${className}${inked ? ' is-inked' : ''}`}>
      {children}
    </Tag>
  );
}

export const Mark = ({ children }) => (
  <Ink as="mark" className="ink">
    {children}
  </Ink>
);

export const Uline = ({ children }) => (
  <Ink as="span" className="uline">
    {children}
  </Ink>
);
