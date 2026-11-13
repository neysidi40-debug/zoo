/* ============================================================
   ZOO — Hero
   ============================================================
   A primeira tela. Do React Bits vêm:
     · Aurora          → o fundo, nas cores laranja do Zoo
     · TextType        → a palavra que se reveza no fim do título
     · SpecularButton  → o botão principal, com o brilho que segue o mouse
     · LogoLoop        → o letreiro da base (anda sozinho e dá pra arrastar)

   `ready` vem do App e vira true quando a tela de abertura começa a
   sair: é o que segura a entrada do hero, pra ela não se gastar atrás
   do véu. A logo flutuante ao lado do texto (e a piscada dela) é CSS
   puro, no global.css — ela espera a classe is-ready.
   ============================================================ */

import { motion } from 'motion/react';
import Aurora from '../../reactbits/Aurora.jsx';
import TextType from '../../reactbits/TextType.jsx';
import SpecularButton from '../../reactbits/SpecularButton.jsx';
import LogoLoop from '../../reactbits/LogoLoop.jsx';
import { Mark } from '../Ink.jsx';
import { EASE, RevealContext } from '../Reveal.jsx';
import { useThemeContext } from '../../hooks/useTheme.js';
import { PALAVRAS_HERO, SEGMENTOS } from '../../data/site.js';

const AURORA_STOPS = ['#C73E0A', '#FF7A1A', '#FF5A1F'];

/* cada bloco sobe 24px e aparece; o atraso faz a escadinha */
const rise = delay => ({
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } }
});

const LEDE_DELAY = 0.36;
const MARQUEE_ITEMS = SEGMENTOS.map(nome => ({
  node: <span className="marquee-item">{nome}</span>,
  title: nome
}));

const goTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Hero({ ready }) {
  const { light } = useThemeContext();
  const state = ready ? 'show' : 'hidden';

  return (
    <section className={`hero${ready ? ' is-ready' : ''}`}>
      <div className="hero-aurora" aria-hidden="true">
        {ready && <Aurora colorStops={AURORA_STOPS} amplitude={1} blend={0.5} speed={0.5} lightMode={light} />}
      </div>
      <div className="grid-bg" />

      <div className="wrap">
        <motion.div className="hero-tag" variants={rise(0)} initial="hidden" animate={state}>
          <span className="dot" />
          <span className="mono">ESTÚDIO DE SITES — RECIFE, PE</span>
        </motion.div>

        <h1>
          <motion.span variants={rise(0)} initial="hidden" animate={state}>
            Bonitos de ver,
          </motion.span>
          <motion.span variants={rise(0.12)} initial="hidden" animate={state}>
            fáceis de usar,
          </motion.span>
          <motion.span className="l3" variants={rise(0.24)} initial="hidden" animate={state}>
            feitos pra{' '}
            {ready ? (
              <TextType
                as="span"
                className="typed-word"
                text={PALAVRAS_HERO}
                typingSpeed={85}
                deletingSpeed={45}
                pauseDuration={2200}
                initialDelay={550}
                cursorStyle="bar"
                cursorBlinkDuration={0.5}
              />
            ) : (
              <span className="typed-word" />
            )}
          </motion.span>
        </h1>

        {/* o marca-texto do parágrafo espera a entrada dele terminar */}
        <RevealContext.Provider value={{ shown: ready, settleMs: (LEDE_DELAY + 0.7) * 1000 }}>
          <motion.p className="lede" data-ink-host="" variants={rise(LEDE_DELAY)} initial="hidden" animate={state}>
            Projetamos e construímos o site do seu negócio do zero — estrutura, design e conteúdo pensados para{' '}
            <Mark>transformar visita em cliente</Mark>, não apenas para ficar bonito parado.
          </motion.p>
        </RevealContext.Provider>

        <motion.div className="hero-actions" variants={rise(0.46)} initial="hidden" animate={state}>
          {/* o vidro é o mesmo dos outros botões do site (--glass-bg + blur);
              no tema claro o texto e o brilho da borda viram o laranja do tema */}
          <SpecularButton
            size="lg"
            radius={18}
            tint="#ffffff"
            tintOpacity={light ? 0.5 : 0.07}
            blur={12}
            textColor={light ? '#E4531B' : '#f5f5f5'}
            lineColor={light ? '#E4531B' : '#ffffff'}
            baseColor={light ? '#CFC4B1' : '#525252'}
            shineSize={10}
            shineFade={40}
            thickness={1}
            speed={0.35}
            proximity={250}
            onClick={() => goTo('contato')}
          >
            Pedir orçamento
          </SpecularButton>

          {/* "Ver projetos" em forma de árvore de diretórios: nasce mais pra
              direita, escorrega de leve pra esquerda e só então o sublinhado
              se desenha */}
          <motion.div
            className="hero-tree"
            initial={{ opacity: 0, x: 16 }}
            animate={ready ? { opacity: [0, 1, 1], x: [16, 16, 0] } : { opacity: 0, x: 16 }}
            transition={{ duration: 1.5, delay: 1.2, times: [0, 0.3, 1], ease: [EASE, [0.16, 1, 0.3, 1]] }}
          >
            <a className="hero-tree__link" href="#servicos">
              <span className="hero-tree__branch mono" aria-hidden="true">
                └──
              </span>
              <motion.span
                className="hero-tree__label"
                initial={{ backgroundSize: '0% 2px' }}
                animate={{ backgroundSize: ready ? '100% 2px' : '0% 2px' }}
                transition={{ duration: 0.55, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
              >
                Ver projetos
              </motion.span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      <div className="marquee-wrap">
        {ready && (
          <LogoLoop
            className="marquee"
            logos={MARQUEE_ITEMS}
            speed={42}
            direction="left"
            logoHeight={22}
            gap={0}
            fadeOut={false}
            pauseOnHover={false}
            ariaLabel="Para quem a gente constrói"
          />
        )}
      </div>
    </section>
  );
}
