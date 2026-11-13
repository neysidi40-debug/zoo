/* ============================================================
   ZOO — entrada ao rolar
   ============================================================
   <Reveal> faz o bloco surgir (sobe 26px e aparece) na primeira vez que
   entra na tela. Itens de uma mesma grade passam `delay` crescente pra
   entrarem em sequência — use a função stagger(i).

   Além de animar, ele avisa os filhos pelo RevealContext: quando o bloco
   entrou (`shown`) e quanto tempo leva pra assentar (`settleMs`). É por
   aí que o marca-texto (Ink.jsx) sabe a hora de passar a caneta, e é
   por isso que o bloco também ganha a classe `is-visible` — algumas
   animações que são só CSS (o gráfico, os checks, a piscada dos
   quadradinhos) esperam por ela.
   ============================================================ */

import { createContext, useMemo, useState } from 'react';
import { motion } from 'motion/react';

export const EASE = [0.2, 0.7, 0.3, 1];
export const stagger = index => index * 0.08;

export const RevealContext = createContext({ shown: true, settleMs: 0 });

export function Reveal({ as = 'div', delay = 0, duration = 0.7, y = 26, amount = 0.15, className = '', children, ...rest }) {
  const [shown, setShown] = useState(false);
  const Tag = motion[as];
  const context = useMemo(() => ({ shown, settleMs: (delay + duration) * 1000 }), [shown, delay, duration]);

  return (
    <RevealContext.Provider value={context}>
      <Tag
        data-ink-host=""
        className={`${className}${shown ? ' is-visible' : ''}`.trim()}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount, margin: '0px 0px -60px 0px' }}
        transition={{ duration, delay, ease: EASE }}
        onViewportEnter={() => setShown(true)}
        {...rest}
      >
        {children}
      </Tag>
    </RevealContext.Provider>
  );
}
