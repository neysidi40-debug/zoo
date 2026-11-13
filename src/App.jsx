/* ============================================================
   ZOO — a página
   ============================================================
   A ordem das seções é a ordem em que aparecem aqui. Cada uma mora no
   seu arquivo, em components/sections.

   `introDone` é o único estado da página inteira: vira true quando a
   tela de abertura dá a hora de sair. É ele que tira o véu (com o fade
   do AnimatePresence) e libera a entrada do hero.

   Seções que já existiram e estão fora do ar (trust bar, grade de
   projetos, time, depoimentos) ficaram no histórico do git — os estilos
   delas continuam no global.css, pra quando voltarem.
   ============================================================ */

import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import IntroVeil from './components/IntroVeil.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Hero from './components/sections/Hero.jsx';
import Growth from './components/sections/Growth.jsx';
import Process from './components/sections/Process.jsx';
import Services from './components/sections/Services.jsx';
import Pricing from './components/sections/Pricing.jsx';
import Deliverables from './components/sections/Deliverables.jsx';
import Faq from './components/sections/Faq.jsx';
import CtaFinal from './components/sections/CtaFinal.jsx';
import { ThemeContext, useTheme } from './hooks/useTheme.js';
import { useInkSelection } from './hooks/useInkSelection.js';

/* filtro da sombra interna da logo da hero (usado no global.css via
   --hero-logo-filter). Segue o formato da PNG pelo canal alfa: inverte o
   alfa, borra, desloca 2px pra baixo, recorta de volta pra dentro da logo
   e pinta de laranja bem escuro por cima da imagem. */
const LogoShadowFilter = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
    <filter id="logo-inner-shadow" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceAlpha" result="inverse">
        <feFuncA type="table" tableValues="1 0" />
      </feComponentTransfer>
      <feGaussianBlur in="inverse" stdDeviation="3" result="blur" />
      <feOffset in="blur" dx="0" dy="2" result="offset" />
      <feComposite in="offset" in2="SourceAlpha" operator="in" result="shadowShape" />
      <feFlood floodColor="#6E2406" floodOpacity="0.55" />
      <feComposite in2="shadowShape" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shadow" />
      </feMerge>
    </filter>
  </svg>
);

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const theme = useTheme();
  useInkSelection();

  return (
    // "user": quem pede menos movimento no sistema recebe as animações reduzidas
    <MotionConfig reducedMotion="user">
      <ThemeContext.Provider value={theme}>
        <AnimatePresence>{!introDone && <IntroVeil key="intro" onDone={() => setIntroDone(true)} />}</AnimatePresence>

        <a className="skip-link" href="#top">
          Pular para o conteúdo
        </a>
        <LogoShadowFilter />
        <ScrollProgress />
        <Header />

        <main id="top">
          <Hero ready={introDone} />
          <Growth />
          <Process />
          <Services />
          <Pricing />
          <Deliverables />
          <Faq />
          <CtaFinal />
        </main>

        <Footer />
        <ThemeToggle />
      </ThemeContext.Provider>
    </MotionConfig>
  );
}
