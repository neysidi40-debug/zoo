/* ============================================================
   ZOO — Header compacto
   ============================================================
   No topo da página a nav fica aberta, unida ao grid da hero.
   No primeiro scroll ela encolhe até virar uma bolinha no canto
   superior esquerdo só com o coala; clicar na bolinha volta ao topo.
   Voltando ao topo, ela abre de novo.

   Vale nos dois tamanhos; muda só a medida final da bolinha. No mobile
   o hambúrguer não se recolhe junto: ele mora fora do <header> e fica
   parado no canto, senão o menu ficaria inalcançável depois do
   primeiro scroll.

   Por que o morph é feito quadro a quadro, e não com transition do CSS
   nem com estado do React: animar width/height/border-radius junto com
   overflow:hidden via `transition` faz o Chrome/Edge/Safari trocarem de
   camada no meio da animação e piscar um frame. E passar cada quadro
   pelo estado do React renderizaria o header 60 vezes por segundo à
   toa. Aqui cada quadro calcula o valor (com easing) e aplica direto no
   style do elemento — por isso as classes is-compact / is-visible /
   over-hero também são postas por aqui, e não pelo JSX.
   ============================================================ */

import { useEffect } from 'react';

const TRIGGER = 10; // px de scroll pra compactar ("primeiro scroll")
const DURATION = 350; // ms
/* diâmetro, topo e esquerda finais da bolinha. No desktop batem com a
   bolinha de tema (64px). No mobile os 16px são o mesmo recuo que a
   bolinha de tema usa lá embaixo: os três controles flutuantes ficam
   todos à mesma distância da borda da tela. */
const GEOM = {
  desktop: { size: 64, top: 16, left: 20 },
  mobile: { size: 56, top: 16, left: 16 }
};
const HEADER_PROPS = ['width', 'height', 'left', 'right', 'top', 'borderRadius', 'background', 'border', 'backdropFilter', 'transition'];
const WRAP_PROPS = ['overflow', 'height', 'paddingLeft', 'paddingRight'];

const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export function useHeaderMorph(headerRef, wrapRef, bubbleRef) {
  useEffect(() => {
    const header = headerRef.current;
    const wrap = wrapRef.current;
    const bubble = bubbleRef.current;
    if (!header || !wrap || !bubble) return undefined;

    const fading = ['.logo', '.nav-links', '.nav-cta'].map(sel => header.querySelector(sel)).filter(Boolean);
    // cores da bolinha vêm do CSS (--float-bg-rgb / --float-line-rgb),
    // pra acompanharem o tema claro/escuro
    const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const desktop = window.matchMedia('(min-width: 861px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let ratio = 0; // 0 = nav aberta, 1 = bolinha
    let target = 0;
    let from = 0;
    let startTs = null;
    let rafId = null;

    // medidas da nav aberta — só remede com ela aberta, senão mediria a bolinha
    let fullHeight = header.offsetHeight;
    let padLeft = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    let padRight = parseFloat(getComputedStyle(wrap).paddingRight) || 0;
    const measure = () => {
      if (ratio > 0) return;
      fullHeight = header.offsetHeight;
      padLeft = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
      padRight = parseFloat(getComputedStyle(wrap).paddingRight) || 0;
    };

    const applyFrame = r => {
      if (r <= 0.001) {
        // nav aberta: limpa tudo e devolve o controle pro CSS normal
        HEADER_PROPS.forEach(p => (header.style[p] = ''));
        WRAP_PROPS.forEach(p => (wrap.style[p] = ''));
        fading.forEach(el => (el.style.opacity = ''));
        bubble.classList.remove('is-visible');
        header.classList.remove('is-compact');
        return;
      }

      const fullWidth = document.documentElement.clientWidth;
      const compact = r >= 0.995;
      const { size: SIZE, top: TOP, left: LEFT } = desktop.matches ? GEOM.desktop : GEOM.mobile;

      header.style.right = 'auto';
      header.style.width = `${lerp(fullWidth, SIZE, r)}px`;
      header.style.height = `${lerp(fullHeight, SIZE, r)}px`;
      header.style.left = `${lerp(0, LEFT, r)}px`;
      header.style.top = `${lerp(0, TOP, r)}px`;
      header.style.borderRadius = `${lerp(0, SIZE / 2, r)}px`;
      header.style.background = `rgba(${cssVar('--float-bg-rgb')},${lerp(0, 0.94, r)})`;
      header.style.border = `1px solid rgba(${cssVar('--float-line-rgb')},${r})`;
      header.style.backdropFilter = compact ? 'blur(10px)' : 'none';
      // durante o morph nenhuma transition do CSS pode rodar; parada, só o hover
      header.style.transition = compact ? 'transform 0.25s ease, box-shadow 0.25s ease' : 'none';

      wrap.style.overflow = 'hidden';
      wrap.style.height = '100%';
      wrap.style.paddingLeft = `${lerp(padLeft, 0, r)}px`;
      wrap.style.paddingRight = `${lerp(padRight, 0, r)}px`;

      fading.forEach(el => (el.style.opacity = `${1 - r}`));
      bubble.classList.toggle('is-visible', r > 0.55);
      header.classList.toggle('is-compact', compact);
    };

    const step = ts => {
      if (startTs === null) startTs = ts;
      const t = Math.min((ts - startTs) / DURATION, 1);
      ratio = lerp(from, target, easeOutCubic(t));
      applyFrame(ratio);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        ratio = target;
        applyFrame(ratio);
        rafId = null;
      }
    };

    const animateTo = (to, instant) => {
      if (to === target && !instant) return;
      target = to;
      if (instant || reduceMotion.matches) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        ratio = to;
        applyFrame(ratio);
        return;
      }
      from = ratio;
      startTs = null;
      if (rafId === null) rafId = requestAnimationFrame(step);
    };

    const wanted = () => (window.scrollY > TRIGGER ? 1 : 0);

    /* Nav transparente enquanto está sobre a hero, pra a aurora passar por
       trás; depois que a hero sai de baixo da nav, volta ao fundo normal */
    const hero = document.querySelector('.hero');
    const updateOverHero = () => {
      if (!hero) return;
      header.classList.toggle('over-hero', hero.getBoundingClientRect().bottom > fullHeight);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        animateTo(wanted());
        updateOverHero();
        ticking = false;
      });
    };

    const onResize = () => {
      measure();
      updateOverHero();
      if (ratio > 0 && ratio < 1) return; // no meio do morph o próximo frame já corrige
      applyFrame(ratio);
    };

    // trocou de faixa de tamanho: pula direto pro estado certo, com a medida nova
    const onBreakpoint = () => {
      measure();
      applyFrame(ratio);
      animateTo(wanted(), true);
    };

    const onBubbleClick = () => window.scrollTo({ top: 0 }); // o html já tem scroll-behavior: smooth

    // trocou o tema com a bolinha fechada: reaplica pra pegar as cores novas
    const themeObserver = new MutationObserver(() => applyFrame(ratio));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    desktop.addEventListener('change', onBreakpoint);
    bubble.addEventListener('click', onBubbleClick);

    // estado inicial sem animação (ex: recarregou a página já rolada)
    updateOverHero();
    animateTo(wanted(), true);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      themeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      desktop.removeEventListener('change', onBreakpoint);
      bubble.removeEventListener('click', onBubbleClick);
      applyFrame(0);
    };
  }, [headerRef, wrapRef, bubbleRef]);
}
