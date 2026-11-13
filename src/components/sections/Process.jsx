/* ============================================================
   ZOO — Como o projeto anda (timeline)
   ============================================================
   Quando a timeline entra na tela, a linha laranja corre do passo 1 ao
   4 e cada marcador acende quando a linha chega nele.

   A linha é feita de segmentos (um por passo, no CSS) — horizontais no
   desktop, verticais no mobile. Aqui um único valor animado (progress,
   de 0 a 1) é repartido entre os passos: cada um lê a sua fatia pela
   variável --fill, sem o React renderizar a cada quadro. Com "reduzir
   movimento", a timeline já aparece completa.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { Reveal, stagger } from '../Reveal.jsx';
import { SectionHead } from '../SectionHead.jsx';
import { Mark } from '../Ink.jsx';

const TIMELINE_S = 1.1; // duração total, do 1 ao 4
const START_DELAY_S = 0.25; // respiro depois de entrar na tela
const clamp01 = value => Math.min(Math.max(value, 0), 1);

const STEPS = [
  {
    title: 'Diagnóstico',
    text: 'Entendemos seu negócio, seu cliente e o que o site precisa fazer por você.'
  },
  {
    title: 'Design',
    text: (
      <>
        Layout e identidade visual próprios, <Mark>aprovados com você antes de programar</Mark>.
      </>
    )
  },
  {
    title: 'Desenvolvimento',
    text: 'Construção do site, testado em celular, tablet e computador.'
  },
  {
    title: 'Lançamento',
    text: 'Site no ar, domínio configurado e você treinado para usar o painel.'
  }
];
const SEGMENTS = STEPS.length - 1;

function Step({ index, progress, title, children }) {
  // 0 = a linha ainda não saiu deste passo, 1 = já chegou no próximo
  const fill = useTransform(progress, p => clamp01(p * SEGMENTS - index));
  const [done, setDone] = useState(false);

  // o marcador acende quando a linha chega nele
  useMotionValueEvent(progress, 'change', p => {
    if (!done && p * SEGMENTS >= index) setDone(true);
  });

  return (
    <Reveal className={`step${done ? ' is-done' : ''}`} delay={stagger(index)} style={{ '--fill': fill }}>
      <div className="step-marker">{String(index + 1).padStart(2, '0')}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </Reveal>
  );
}

export default function Process() {
  const lineRef = useRef(null);
  const inView = useInView(lineRef, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      progress.set(1);
      return undefined;
    }
    const controls = animate(progress, 1, { duration: TIMELINE_S, delay: START_DELAY_S, ease: 'easeInOut' });
    return () => controls.stop();
  }, [inView, reduce, progress]);

  return (
    <section id="processo">
      <div className="wrap">
        <SectionHead lines={['Como o projeto', 'anda']}>
          Quatro etapas, sempre com você acompanhando — <Mark>sem sumiço e sem surpresa na entrega</Mark>.
        </SectionHead>
        <motion.div className="process-line" ref={lineRef}>
          {STEPS.map((step, index) => (
            <Step key={step.title} index={index} progress={progress} title={step.title}>
              {step.text}
            </Step>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
