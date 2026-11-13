/* ============================================================
   ZOO — Carrossel de projetos
   ============================================================
   Um slide por vez: o vídeo do site ao vivo, a legenda por cima e, ao
   lado, a ficha do projeto da vez. Os projetos vêm de data/projects.js.

   · Só o slide da vez toca. Cada projeto tem um vídeo de alguns MB:
     tocar (e baixar) todos de uma vez pesaria à toa. Os vídeos vêm com
     preload="none" + capa; toca só o do slide que está na tela, e o
     seguinte começa a carregar antes de a pessoa chegar nele.
   · No celular (até 860px) não há fichas flutuantes: uma pill "Celular |
     Desktop" escolhe a gravação que o slide mostra — a de celular vem
     numa moldura de aparelho, com a capa desfocada no fundo — e a ficha
     do projeto fica fixa embaixo do vídeo. Só um vídeo toca por vez.
   · A ficha da direita (.work-tip) troca de conteúdo com um fade curto.
   · A ficha da esquerda (.work-phone) mostra o mesmo projeto no celular.
     Só existe em tela larga com mouse e só nos projetos que têm `phone`.
   · Na primeira vez que o carrossel aparece, as setas fazem a animação
     do hover uma vez e a borda acende (is-hinting / is-pulsing no CSS),
     pra mostrar que dá pra passar.

   Com "reduzir movimento", o vídeo não toca sozinho e a dica não roda.
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../Reveal.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useSnapCarousel } from '../../hooks/useSnapCarousel.js';
import { PROJECTS } from '../../data/projects.js';

const REVEAL_MS = 700; // duração da entrada do bloco
const HINT_MS = 900; // quanto tempo a classe da dica fica ligada
const VIDEO_WAIT = 1500; // não espera o vídeo pra sempre (rede lenta)

const VIEWS = [
  { id: 'phone', label: 'Celular' },
  { id: 'desktop', label: 'Desktop' }
];

const Arrow = ({ points }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points={points} vectorEffect="non-scaling-stroke" />
  </svg>
);

function Tip({ project }) {
  const { info } = project;
  const external = info.href.startsWith('http');
  return (
    <>
      <span className="mono">{info.label}</span>
      <h3>{project.name}</h3>
      <p>{info.text}</p>
      {info.bullets && (
        <ul>
          {info.bullets.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {info.stack && <p className="work-tip__stack mono">{info.stack}</p>}
      <a href={info.href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
        {info.hrefLabel ?? 'Ver ao vivo ↗'}
      </a>
    </>
  );
}

export default function WorkCarousel() {
  const boxRef = useRef(null);
  const trackRef = useRef(null);
  const videoRefs = useRef([]);
  const phoneVideoRef = useRef(null);
  const hinted = useRef(false);

  const [active, setActive] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [pointerIn, setPointerIn] = useState(false);
  const [preloadUpTo, setPreloadUpTo] = useState(0);
  const [hinting, setHinting] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const reduce = useReducedMotion();
  const wide = useMediaQuery('(hover: hover) and (min-width: 1280px)');
  /* tela de celular: em vez das fichas flutuantes, uma pill escolhe qual
     gravação o slide mostra (a do celular ou a do desktop) e a ficha do
     projeto fica fixa embaixo do vídeo. O 860 tem par no global.css. */
  const compact = useMediaQuery('(max-width: 860px)');
  const [view, setView] = useState('phone');
  const tall = compact && view === 'phone'; // slides no formato em pé
  const { step, edges } = useSnapCarousel(trackRef);

  const project = PROJECTS[active];
  // o que a pill mostra marcado: projeto sem vídeo de celular cai em "Desktop"
  const shownView = view === 'phone' && project.phone ? 'phone' : 'desktop';
  // a ficha do celular guarda o último vídeo: assim ela não esvazia
  // enquanto some, ao passar pra um projeto sem versão de celular
  const [phone, setPhone] = useState(project.phone ?? null);
  useEffect(() => {
    if (project.phone) setPhone(project.phone);
  }, [project]);

  /* slide da vez = o que ocupa mais da metade da faixa */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const slides = Array.from(track.children);
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;
          const index = slides.indexOf(entry.target);
          if (index !== -1) setActive(index);
        });
      },
      { root: track, threshold: 0.6 }
    );
    slides.forEach(slide => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  /* o carrossel está na tela? */
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  /* toca só o vídeo da vez; o seguinte já vai carregando */
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      // play() pode ser recusado (economia de dados etc.): fica na capa
      if (index === active && onScreen && !reduce) video.play().catch(() => {});
      else video.pause();
    });
    if (onScreen) setPreloadUpTo(prev => Math.max(prev, active + 1));
    // `tall` entra na lista porque trocar a pill troca o <video> de cada slide
  }, [active, onScreen, reduce, tall]);

  /* o vídeo do celular só toca enquanto a ficha está à vista: escondido,
     baixar e tocar seria desperdício */
  useEffect(() => {
    const video = phoneVideoRef.current;
    if (!video) return;
    if (project.phone && pointerIn && onScreen && wide && !reduce) video.play().catch(() => {});
    else video.pause();
  }, [project, phone, pointerIn, onScreen, wide, reduce]);

  /* dica das setas + borda, uma vez só: depois da entrada do bloco e com
     o primeiro vídeo já mostrando imagem */
  useEffect(() => {
    if (!onScreen || hinted.current || reduce) return undefined;
    let done = false;
    let hintTimer = 0;
    let waitTimer = 0;
    const video = videoRefs.current[0];
    const hint = () => {
      if (done || hinted.current) return;
      done = true;
      hinted.current = true;
      setHinting(true);
      setPulsing(true);
      hintTimer = setTimeout(() => setHinting(false), HINT_MS);
    };
    const revealTimer = setTimeout(() => {
      if (!video || video.readyState >= 2) {
        hint();
        return;
      }
      video.addEventListener('loadeddata', hint, { once: true });
      waitTimer = setTimeout(hint, VIDEO_WAIT);
    }, REVEAL_MS);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(waitTimer);
      // a dica já disparou: deixa o timer dela terminar, senão a classe ficaria presa
      if (!done) clearTimeout(hintTimer);
      video?.removeEventListener('loadeddata', hint);
    };
  }, [onScreen, reduce]);

  const classes = ['work-carousel', project.phone && 'has-phone', hinting && 'is-hinting', pulsing && 'is-pulsing']
    .filter(Boolean)
    .join(' ');

  return (
    <Reveal
      ref={boxRef}
      className={classes}
      onMouseEnter={() => setPointerIn(true)}
      onMouseLeave={() => setPointerIn(false)}
      onFocus={() => setPointerIn(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPointerIn(false);
      }}
      onAnimationEnd={event => {
        if (event.animationName === 'carousel-edge-sweep') setPulsing(false);
      }}
    >
      {/* só no celular: escolhe a gravação que o slide mostra. Projeto sem
          vídeo de celular trava a pill em "Desktop" */}
      {compact && (
        <div className="plan-toggle view-toggle" role="group" aria-label="Versão do site no vídeo">
          {VIEWS.map(option => {
            const unavailable = option.id === 'phone' && !project.phone;
            return (
              <button
                key={option.id}
                type="button"
                className={`plan-toggle-btn${shownView === option.id ? ' is-active' : ''}`}
                aria-pressed={shownView === option.id}
                disabled={unavailable}
                title={unavailable ? 'Este projeto ainda não tem gravação no celular' : undefined}
                onClick={() => setView(option.id)}
              >
                {option.label}
              </button>
            );
          })}
          <motion.span
            className="plan-toggle-thumb"
            aria-hidden="true"
            initial={false}
            animate={{ x: shownView === 'phone' ? '0%' : '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        </div>
      )}

      <div className="carousel-stage">
        <div className="carousel-track drag-scroll" id="workCarousel" ref={trackRef} tabIndex={0} aria-label="Projetos que já fizemos">
          {PROJECTS.map((item, index) => (
            <figure className={`carousel-slide${tall ? ' carousel-slide--tall' : ''}`} key={item.id}>
              {/* no formato em pé, a capa do projeto desfocada preenche o fundo */}
              {tall && item.poster && <img className="slide-backdrop" src={item.poster} alt="" aria-hidden="true" />}
              {item.placeholder ? (
                <div className="carousel-placeholder">
                  <span className="mono">{item.placeholder.label}</span>
                  <p>{item.placeholder.text}</p>
                </div>
              ) : tall && item.phone ? (
                <div className="slide-device">
                  <div className="work-phone__device">
                    <video
                      key="phone"
                      ref={node => {
                        videoRefs.current[index] = node;
                      }}
                      src={item.phone.video}
                      poster={item.phone.poster}
                      muted
                      loop
                      playsInline
                      preload={index <= preloadUpTo ? 'auto' : 'none'}
                      aria-label={`Vídeo do site ${item.name} no celular`}
                    />
                  </div>
                </div>
              ) : (
                <video
                  key="desktop"
                  ref={node => {
                    videoRefs.current[index] = node;
                  }}
                  src={item.video}
                  poster={item.poster}
                  muted
                  loop
                  playsInline
                  preload={index <= preloadUpTo ? 'auto' : 'none'}
                  aria-label={item.alt}
                />
              )}
              <figcaption>
                <span>{item.name}</span>
                <span className="mono">{item.tag}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* setas dentro do carrossel: bem apagadas, acendem e esticam no hover */}
        <button type="button" className="carousel-btn carousel-btn--prev" aria-controls="workCarousel" aria-label="Projeto anterior" disabled={edges.atStart} onClick={() => step(-1)}>
          <Arrow points="15 18 9 12 15 6" />
        </button>
        <button type="button" className="carousel-btn carousel-btn--next" aria-controls="workCarousel" aria-label="Próximo projeto" disabled={edges.atEnd} onClick={() => step(1)}>
          <Arrow points="9 6 15 12 9 18" />
        </button>
      </div>

      {/* ficha da esquerda: o projeto da vez no celular */}
      <aside className="work-phone" aria-label="O projeto no celular">
        <span className="mono">NO CELULAR</span>
        <div className="work-phone__device">
          <video
            ref={phoneVideoRef}
            src={phone?.video}
            poster={phone?.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label={`Vídeo do site ${project.name} no celular`}
          />
        </div>
      </aside>

      {/* ficha do projeto da vez */}
      <aside className="work-tip" aria-live="polite" aria-label="Sobre o projeto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.id}
            className="work-tip__body"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Tip project={project} />
          </motion.div>
        </AnimatePresence>
      </aside>
    </Reveal>
  );
}
