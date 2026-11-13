/* ============================================================
   ZOO — Tela de abertura
   ============================================================
   Um véu cobre a página no carregamento: fundo de fibras animadas
   (GhostFibers, do React Bits) com a logo no meio, que surge desfocada,
   peça por peça, e dá uma piscada antes de a página aparecer. Roda em
   TODO carregamento, a cada F5.

   A abertura tem três atos, nesta ordem: o fundo se monta, a logo surge
   (Z → O → rosto, a partir de LOGO_IN) e a piscada. Só então o véu sai.
   A piscada é o ponto da tela, então ela nunca pode acontecer junto com
   a saída.

   Quem tira o véu é o App: aqui só se avisa (onDone) quando deu a hora.
   A saída em si é o `exit` abaixo, tocado pelo AnimatePresence do App.
   ============================================================ */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import GhostFibers from '../reactbits/GhostFibers.jsx';
import FiberRays from './FiberRays.jsx';

const HOLD = 2500; // ms até o véu começar a sair
const FADE = 0.65; // s, duração da saída
const LOGO_IN = 0.85; // s, quando a logo começa a entrar
const WINK_AT = LOGO_IN + 1.15; // s, a piscada
const BLUR_EASE = [0.2, 0.7, 0.3, 1];
const WINK_EASE = [0.45, 0, 0.55, 1];

/* cada peça surge desfocada, vinda de cima — a curva de três passos do
   BlurText: desfoque de 10px → 5px → 0, com a opacidade e o deslocamento
   acompanhando */
const blurIn = delay => ({
  initial: { opacity: 0, y: -50, filter: 'blur(10px)' },
  animate: { opacity: [0, 0.5, 1], y: [-50, 5, 0], filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'] },
  transition: { duration: 0.6, times: [0, 0.5, 1], ease: BLUR_EASE, delay }
});

export default function IntroVeil({ onDone }) {
  const reduce = useReducedMotion();
  // lido uma vez, na montagem: o fundo não troca no meio da abertura
  const [mobile] = useState(() => window.matchMedia('(max-width: 860px)').matches);

  useEffect(() => {
    // a rolagem fica travada enquanto o véu cobre a página
    document.body.style.overflow = 'hidden';
    // com "reduzir movimento" a intro só dá um instante e sai
    const timer = setTimeout(
      () => {
        document.body.style.overflow = '';
        onDone();
      },
      reduce ? 250 : HOLD
    );
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
    // roda uma vez só: o véu não recomeça se o App renderizar de novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="intro-veil"
      aria-hidden="true"
      exit={{ opacity: 0 }}
      transition={{ duration: FADE, ease: 'easeInOut' }}
    >
      {/* as fibras vêm apagadas: quem tem que puxar o olho é a logo */}
      {/* no celular o fundo são os raios da versão antiga, refeitos pra tela
          em pé (FiberRays); no desktop, as fibras do React Bits */}
      {!reduce && mobile && <FiberRays className="intro-veil__rays" />}
      {!reduce && !mobile && (
        <div className="intro-veil__fibers">
          <GhostFibers
            glowColor="#FF5A1F"
            lineColor="#FFB38A"
            secondaryColor="#C73E0A"
            speed={0.5}
            layers={3}
            glow={0.8}
            vignette={0.6}
            grain={0.05}
            particles={0.35}
            mouseInteraction={false}
            pulseOnClick={false}
          />
        </div>
      )}

      {/* a logo entra em três tempos: Z, O e o rostinho. São fatias da mesma
          arte, cada arquivo do tamanho da logo inteira (com o resto
          transparente), então empilhadas elas se alinham sozinhas */}
      {reduce ? (
        <div className="intro-logo">
          <img src="/zoo-z.png" alt="" />
          <img src="/zoo-o.png" alt="" />
          <img src="/zoo-face-wink.png" alt="" />
        </div>
      ) : (
        <div className="intro-logo">
          <motion.img src="/zoo-z.png" alt="" {...blurIn(LOGO_IN)} />
          <motion.img src="/zoo-o.png" alt="" {...blurIn(LOGO_IN + 0.17)} />
          {/* o rosto entra por último e, mais tarde, dá a piscada: a camada
              de olhos abertos some enquanto a do olho fechado aparece */}
          <motion.div className="intro-logo__face" {...blurIn(LOGO_IN + 0.34)}>
            <motion.img
              src="/zoo-face-open.png"
              alt=""
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: WINK_EASE, delay: WINK_AT }}
            />
            <motion.img
              src="/zoo-face-wink.png"
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: WINK_EASE, delay: WINK_AT }}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
