/* Fio de progresso de leitura no topo da página: cresce conforme a
   pessoa rola, do início ao fim do documento. A mola deixa o fio
   acompanhar a rolagem macio, sem tranco quando a roda do mouse pula. */

import { motion, useScroll, useSpring } from 'motion/react';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 36, restDelta: 0.001 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
